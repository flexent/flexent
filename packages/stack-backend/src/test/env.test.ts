import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    assertEnv,
    configureEnv,
    isLikelyTestRunner,
    loadEnvFile,
} from '../main/utils/env.js';

const KEY_A = 'FLEXENT_ENV_TEST_A';
const KEY_B = 'FLEXENT_ENV_TEST_B';
const KEY_SHARED = 'FLEXENT_ENV_TEST_SHARED';

describe('isLikelyTestRunner', () => {

    it('detects mocha binaries', () => {
        assert.strictEqual(isLikelyTestRunner(['node', '/app/node_modules/.bin/mocha']), true);
        assert.strictEqual(isLikelyTestRunner(['node', '/app/node_modules/mocha/bin/mocha.js']), true);
        assert.strictEqual(isLikelyTestRunner(['node', 'C:\\app\\node_modules\\.bin\\mocha.cmd']), true);
    });

    it('detects test files', () => {
        assert.strictEqual(isLikelyTestRunner(['node', './out/foo.test.js']), true);
        assert.strictEqual(isLikelyTestRunner(['node', './out/foo.test.mjs']), true);
        assert.strictEqual(isLikelyTestRunner(['tsx', './src/foo.test.ts']), true);
    });

    it('ignores regular app entrypoints', () => {
        assert.strictEqual(isLikelyTestRunner(['node', './out/main/index.js']), false);
        assert.strictEqual(isLikelyTestRunner(['node', './scripts/mocha-reporter.js']), false);
    });

});

describe('loadEnvFile', () => {

    let dir = '';
    let file = '';

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'flexent-env-'));
        file = join(dir, '.env');
        delete process.env[KEY_A];
        delete process.env[KEY_B];
    });

    afterEach(() => {
        delete process.env[KEY_A];
        delete process.env[KEY_B];
        rmSync(dir, { recursive: true, force: true });
    });

    it('does not throw when the file is missing', () => {
        loadEnvFile(join(dir, 'missing.env'));
    });

    it('does not override existing variables by default', () => {
        writeFileSync(file, `${KEY_A}=fromfile\n${KEY_B}=fromfile\n`);
        process.env[KEY_A] = 'fromshell';
        loadEnvFile(file);
        assert.strictEqual(process.env[KEY_A], 'fromshell');
        assert.strictEqual(process.env[KEY_B], 'fromfile');
    });

    it('overrides existing variables when requested', () => {
        writeFileSync(file, `${KEY_A}=fromfile\n`);
        process.env[KEY_A] = 'fromshell';
        loadEnvFile(file, true);
        assert.strictEqual(process.env[KEY_A], 'fromfile');
    });

});

describe('configureEnv', () => {

    let dir = '';
    let cwd = '';

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'flexent-env-'));
        cwd = process.cwd();
        writeFileSync(join(dir, '.env'), `${KEY_A}=base\n`);
        writeFileSync(join(dir, '.env.dev'), `${KEY_B}=dev\n${KEY_SHARED}=dev\n`);
        writeFileSync(join(dir, '.env.test'), `${KEY_SHARED}=test\n`);
        delete process.env[KEY_A];
        delete process.env[KEY_B];
        delete process.env[KEY_SHARED];
        process.chdir(dir);
    });

    afterEach(() => {
        process.chdir(cwd);
        delete process.env[KEY_A];
        delete process.env[KEY_B];
        delete process.env[KEY_SHARED];
        rmSync(dir, { recursive: true, force: true });
    });

    it('lets .env.test override a polluted shell in test mode', () => {
        process.env[KEY_SHARED] = 'fromshell';
        configureEnv('test');
        assert.strictEqual(process.env[KEY_A], 'base');
        assert.strictEqual(process.env[KEY_B], 'dev');
        assert.strictEqual(process.env[KEY_SHARED], 'test');
    });

    it('does not load .env.test in development', () => {
        process.env[KEY_SHARED] = 'fromshell';
        configureEnv('development');
        assert.strictEqual(process.env[KEY_SHARED], 'fromshell');
        assert.strictEqual(process.env[KEY_B], 'dev');
    });

});

describe('assertTestEnv', () => {

    let dir = '';
    let cwd = '';
    let exitCode: number | undefined;
    const originalExit = process.exit;
    const originalError = console.error;
    let errors: string[] = [];

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'flexent-env-'));
        cwd = process.cwd();
        exitCode = undefined;
        errors = [];
        process.chdir(dir);
        process.exit = ((code?: number) => {
            exitCode = code ?? 0;
            throw new Error('EXIT');
        }) as typeof process.exit;
        console.error = (...args: unknown[]) => {
            errors.push(args.map(String).join(' '));
        };
    });

    afterEach(() => {
        process.exit = originalExit;
        console.error = originalError;
        process.chdir(cwd);
        process.env.NODE_ENV = 'test';
        delete process.env[KEY_SHARED];
        rmSync(dir, { recursive: true, force: true });
    });

    it('passes when NODE_ENV=test and .env.test is absent', () => {
        assertEnv();
        assert.strictEqual(exitCode, undefined);
    });

    it('exits when NODE_ENV is not test', () => {
        process.env.NODE_ENV = 'development';
        assert.throws(() => assertEnv(), /EXIT/);
        assert.strictEqual(exitCode, 1);
        assert.match(errors.join('\n'), /NODE_ENV is not "test"/);
    });

    it('exits when process.env does not match .env.test', () => {
        writeFileSync(join(dir, '.env.test'), `${KEY_SHARED}=test\n`);
        process.env[KEY_SHARED] = 'fromshell';
        assert.throws(() => assertEnv(), /EXIT/);
        assert.strictEqual(exitCode, 1);
        assert.match(errors.join('\n'), new RegExp(KEY_SHARED));
    });

    it('passes when process.env matches .env.test', () => {
        writeFileSync(join(dir, '.env.test'), `${KEY_SHARED}=test\n`);
        process.env[KEY_SHARED] = 'test';
        assertEnv();
        assert.strictEqual(exitCode, undefined);
    });

});
