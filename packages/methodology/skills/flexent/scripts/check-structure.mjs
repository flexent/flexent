#!/usr/bin/env node
// Flexent methodology structure check: flags module kinds and directory roles that drifted.
// Usage: node check-structure.mjs [root=.]   Exit code 1 when anything is flagged.
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const SKIP_DIRS = new Set([
    'node_modules',
    'out',
    'dist',
    'build',
    'coverage',
    '.git',
    '.wrangler',
    'generated',
    'test',
    'tests',
]);
const NEUTRAL = new Set(['index', 'types', 'constants', 'errors', 'main', 'entrypoint', 'cli']);
const root = process.argv[2] ?? '.';
const findings = [];

function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    const modules = [];
    for (const entry of entries) {
        if (entry.isDirectory() && !SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
            walk(join(dir, entry.name));
        } else if (entry.isFile() && isSource(entry.name)) {
            modules.push(checkModule(join(dir, entry.name)));
        }
    }
    checkDirectory(dir, modules);
}

function isSource(name) {
    return name.endsWith('.ts') && !name.endsWith('.d.ts') && !/\.(test|spec|config)\.ts$/.test(name);
}

function checkModule(file) {
    const name = basename(file).split('.')[0];
    const source = readFileSync(file, 'utf8');
    const classes = [...source.matchAll(/^export (?:default )?(?:abstract )?class (\w+)/gm)].map(match => match[1]);
    const functions = [
        ...source.matchAll(/^(?:export )?(?:async )?function\*? (\w+)/gm),
        ...source.matchAll(/^(?:export )?const (\w+)(?::[^=]+)? = (?:async )?(?:function\b|\([^)]*\)[^=]*=>|\w+ =>)/gm),
    ].map(match => match[1]);
    const kind = moduleKind(name, classes, functions);
    if (kind === 'class' && functions.length > 0) {
        report(file, `top-level function${functions.length > 1 ? 's' : ''} in a class module: ${functions.join(', ')}`);
    }
    if (kind === 'class' && classes.length > 0 && !classes.includes(name)) {
        report(file, `module is named ${name} but exports ${classes.join(', ')}`);
    }
    const owned = classes.filter(className => !className.endsWith('Error'));
    if (kind === 'class' && owned.length > 1) {
        report(file, `more than one exported class: ${owned.join(', ')}`);
    }
    if (kind === 'helper' && classes.length > 0) {
        report(file, `class in a helper module: ${classes.join(', ')} (name the file after the class, or move it)`);
    }
    if (kind === 'helper' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
        report(file, 'helper modules are kebab-case');
    }
    return kind;
}

/** Lowercase modules with neither classes nor functions hold types or constants: they fit anywhere. */
function moduleKind(name, classes, functions) {
    if (NEUTRAL.has(name)) {
        return 'neutral';
    }
    if (/^[A-Z]/.test(name)) {
        return 'class';
    }
    return classes.length + functions.length > 0 ? 'helper' : 'neutral';
}

function checkDirectory(dir, kinds) {
    if (kinds.includes('class') && kinds.includes('helper')) {
        report(dir, 'directory mixes class modules and helper modules: give each role its own directory');
    }
}

function report(path, message) {
    findings.push(`${relative(root, path) || '.'}: ${message}`);
}

walk(root);
for (const finding of findings) {
    console.info(finding);
}
console.info(findings.length ? `\n${findings.length} finding(s)` : 'No structural drift found.');
process.exit(findings.length ? 1 : 0);
