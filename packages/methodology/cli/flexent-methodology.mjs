#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Methodology } from '../out/main/index.js';

const USAGE = `Usage: flexent-methodology <command> [dir]

Commands:
  sync [root]        Install or refresh the rules and skill in a project (default: current directory)
  check [root]       Exit with 1 if the installed rules or skill are missing or stale
  structure [dir]    Report module kinds and directory roles that drifted`;

const [command, target = '.'] = process.argv.slice(2);
const root = resolve(target);
const methodology = new Methodology(root);

if (command === 'sync') {
    const touched = methodology.sync();
    console.info(touched.length ? touched.map(path => `  updated ${relative(root, path)}`).join('\n') : 'Flexent methodology is up to date.');
} else if (command === 'check') {
    const issues = methodology.check();
    for (const issue of issues) {
        console.error(`${issue.path}: ${issue.message}`);
    }
    console.info(issues.length ? 'Run `npx flexent-methodology sync` to fix.' : 'Flexent methodology is up to date.');
    process.exitCode = issues.length ? 1 : 0;
} else if (command === 'structure') {
    const script = fileURLToPath(new URL('../skills/flexent/scripts/check-structure.mjs', import.meta.url));
    process.exitCode = spawnSync(process.execPath, [script, resolve(target)], { stdio: 'inherit' }).status ?? 1;
} else {
    console.info(USAGE);
    process.exitCode = command ? 1 : 0;
}
