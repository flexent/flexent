import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Command } from 'commander';

import { Ensemble } from './Ensemble.js';

export async function main() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8'));
    const program = new Command('ensemble')
        .version(pkg.version)
        .description('Run apps defined in an ensemble.yaml file')
        .option('-f, --file <path>', 'Config file path', 'ensemble.yaml')
        .action(async options => {
            try {
                const ensemble = new Ensemble();
                await ensemble.resolve(options.file);
                await ensemble.startAll();
                const shutdown = async () => {
                    await ensemble.stopAll();
                    process.exit(0);
                };
                process.once('SIGINT', shutdown);
                process.once('SIGTERM', shutdown);
            } catch (error: unknown) {
                console.error(error);
                process.exit(1);
            }
        });
    await program.parseAsync(process.argv);
}
