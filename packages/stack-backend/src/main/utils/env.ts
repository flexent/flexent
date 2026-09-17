import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

export type EnvName = 'development' | 'test' | 'production';

export function getEnvName() {
    if (process.env.NODE_ENV === 'development') {
        return 'development';
    }
    if (process.env.NODE_ENV === 'test') {
        return 'test';
    }
    return 'production';
}

export function isLikelyTestRunner(argv: string[] = process.argv) {
    for (const arg of argv) {
        if (isMochaPath(arg) || isTestFilePath(arg)) {
            return true;
        }
    }
    return false;
}

export function loadEnvFile(path: string, override = false) {
    const parsed = readEnvFile(path);
    if (parsed == null) {
        return;
    }
    for (const [key, value] of Object.entries(parsed)) {
        if (value === undefined) {
            continue;
        }
        if (override || process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

export function configureEnv(env: EnvName) {
    loadEnvFile('.env');
    if (env === 'development') {
        loadEnvFile('.env.dev');
    }
    if (env === 'test') {
        loadEnvFile('.env.test', true);
        loadEnvFile('.env.dev');
    }
}

export function assertEnv() {
    if (!isLikelyTestRunner()) {
        return;
    }
    if (process.env.NODE_ENV !== 'test') {
        failTestEnv(formatNodeEnvError());
    }
    const expected = readEnvFile('.env.test');
    if (expected == null) {
        return;
    }
    const mismatches = findMismatches(expected);
    if (mismatches.length > 0) {
        failTestEnv(formatMismatchError(mismatches));
    }
}

function readEnvFile(path: string) {
    try {
        return parseEnv(readFileSync(path, 'utf8'));
    } catch (error: any) {
        if (error?.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

function findMismatches(expected: NodeJS.Dict<string>) {
    const mismatches: string[] = [];
    for (const [key, value] of Object.entries(expected)) {
        if (value === undefined) {
            continue;
        }
        if (process.env[key] !== value) {
            mismatches.push(key);
        }
    }
    return mismatches;
}

function isMochaPath(arg: string) {
    return /(?:^|[/\\])_?mocha(?:\.js|\.cjs|\.mjs|\.cmd|\.exe)?$/.test(arg);
}

function isTestFilePath(arg: string) {
    return /\.test\.[cm]?[jt]s$/.test(arg);
}

function failTestEnv(message: string): never {
    console.error(message);
    process.exit(1);
}

function formatNodeEnvError() {
    const actual = process.env.NODE_ENV;
    const shown = actual == null ? '<unset>' : JSON.stringify(actual);
    return [
        'Refusing to start: this process looks like a test runner, but NODE_ENV is not "test".',
        `Current NODE_ENV: ${shown}`,
        'Run tests with NODE_ENV=test (e.g. npm test).',
    ].join('\n');
}

function formatMismatchError(mismatches: string[]) {
    return [
        'Refusing to start: this process looks like a test runner, but process.env does not match .env.test.',
        `Mismatched keys: ${mismatches.join(', ')}`,
        'Run tests with NODE_ENV=test so .env.test is applied.',
    ].join('\n');
}
