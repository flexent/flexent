// Installs the methodology into the project that ran `npm install`.
// Never fails an install. Skipped in CI, for global installs, and with FLEXENT_METHODOLOGY_SKIP=1.
// Package managers that skip install scripts (pnpm, Yarn) need `npx flexent-methodology sync` instead.

import { resolve, sep } from 'node:path';

const root = process.env.INIT_CWD;
const skip = !root ||
    process.env.CI ||
    process.env.FLEXENT_METHODOLOGY_SKIP ||
    process.env.npm_config_global === 'true' ||
    resolve(root).split(sep).includes('node_modules');

if (!skip) {
    try {
        const { Methodology } = await import('../out/main/index.js');
        const touched = new Methodology(resolve(root)).sync();
        if (touched.length) {
            console.info(`@flexent/methodology: updated ${touched.length} path(s); review and commit them.`);
        }
    } catch (error) {
        console.warn(`@flexent/methodology: skipped (${error?.message}). Run \`npx flexent-methodology sync\`.`);
    }
}
