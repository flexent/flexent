#!/usr/bin/env node

import { Command } from 'commander';

import { listPublishWorkspaceFlags } from '../out/main/index.js';

const program = new Command();
program
    .name('ls-publish-workspaces')
    .description('Print npm -w flags for non-private workspaces')
    .action(async () => {
        const result = await listPublishWorkspaceFlags({ rootDir: process.cwd() });
        console.info(result);
    });
await program.parseAsync(process.argv);
