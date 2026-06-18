import { Schema } from 'airtight';

import {
    EnsembleAppConfig,
    EnsembleAppConfigSchema,
} from './EnsembleAppConfig.js';

export const DEFAULT_STOP_GRACE_PERIOD_MS = 5000;

export interface EnsembleConfig {
    apps: EnsembleAppConfig[];
    sharedEnv: Record<string, unknown>;
    stopGracePeriodMs: number;
}

export const EnsembleConfigSchema = new Schema<EnsembleConfig>({
    type: 'object',
    properties: {
        apps: {
            type: 'array',
            items: EnsembleAppConfigSchema.schema,
        },
        sharedEnv: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
        stopGracePeriodMs: {
            type: 'integer',
            default: DEFAULT_STOP_GRACE_PERIOD_MS,
        },
    },
});
