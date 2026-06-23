import assert from 'node:assert';

import {
    DEFAULT_STOP_GRACE_PERIOD_MS,
    EnsembleConfigSchema,
} from '../main/schema/EnsembleConfig.js';

describe('EnsembleConfigSchema', () => {

    it('decodes apps and sharedEnv', () => {
        const config = EnsembleConfigSchema.decode({
            apps: [{
                id: 'api',
                dir: 'packages/api',
                entrypoint: 'out/bin/run.js',
            }],
            sharedEnv: {
                LOG_PRETTY: 'true',
            },
        });
        assert.equal(config.apps.length, 1);
        assert.equal(config.apps[0]?.id, 'api');
        assert.equal(config.sharedEnv.LOG_PRETTY, 'true');
    });

    it('applies default stopGracePeriodMs when omitted', () => {
        const config = EnsembleConfigSchema.decode({
            apps: [],
        });
        assert.equal(config.stopGracePeriodMs, DEFAULT_STOP_GRACE_PERIOD_MS);
    });

    it('decodes custom stopGracePeriodMs', () => {
        const config = EnsembleConfigSchema.decode({
            apps: [],
            stopGracePeriodMs: 2500,
        });
        assert.equal(config.stopGracePeriodMs, 2500);
    });

    it('decodes optional args on apps', () => {
        const config = EnsembleConfigSchema.decode({
            apps: [{
                id: 'api',
                dir: 'packages/api',
                entrypoint: 'out/bin/run.js',
                args: ['--watch', '--verbose'],
            }],
        });
        assert.deepEqual(config.apps[0]?.args, ['--watch', '--verbose']);
    });

});
