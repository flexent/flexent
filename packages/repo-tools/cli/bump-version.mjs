#!/usr/bin/env node

import { Command } from 'commander';

import { bumpVersion } from '../out/main/index.js';

const program = new Command();
program
    .name('bump-version')
    .description('Bump workspace package versions and workspace dependencies')
    .action(async () => {
        await bumpVersion({
            rootDir: process.cwd()
        });
    });
await program.parseAsync(process.argv);
