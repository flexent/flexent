#!/usr/bin/env node

import { Command } from 'commander';

import { bumpVersion } from '../out/main/index.js';

const program = new Command();
program
    .name('bump-version')
    .description('Bump workspace package versions and prefixed dependencies')
    .option('-p, --prefix <prefix>', 'Package prefix for dependency rewrites')
    .action(async options => {
        await bumpVersion({
            rootDir: process.cwd(),
            prefix: options.prefix
        });
    });
await program.parseAsync(process.argv);
