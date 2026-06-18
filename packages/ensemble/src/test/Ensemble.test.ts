import assert from 'node:assert';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Ensemble } from '../main/Ensemble.js';
import { DEFAULT_STOP_GRACE_PERIOD_MS } from '../main/schema/EnsembleConfig.js';

describe('Ensemble', () => {

    it('loads stopGracePeriodMs from yaml', async () => {
        const dir = await mkdtemp(path.join(os.tmpdir(), 'ensemble-test-'));
        const file = path.join(dir, 'ensemble.yaml');
        await writeFile(file, 'stopGracePeriodMs: 2500\napps: []\n');
        const ensemble = new Ensemble();
        await ensemble.load(file);
        assert.equal(ensemble.config.stopGracePeriodMs, 2500);
        assert.equal(ensemble.rootDir, dir);
    });

    it('uses default stopGracePeriodMs when yaml omits it', async () => {
        const dir = await mkdtemp(path.join(os.tmpdir(), 'ensemble-test-'));
        const file = path.join(dir, 'ensemble.yaml');
        await writeFile(file, 'apps: []\n');
        const ensemble = new Ensemble();
        await ensemble.load(file);
        assert.equal(ensemble.config.stopGracePeriodMs, DEFAULT_STOP_GRACE_PERIOD_MS);
    });

});
