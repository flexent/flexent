import { Schema } from 'airtight';

import {
    EnsembleAppConfig,
    EnsembleAppConfigSchema,
} from './EnsembleAppConfig.js';

export interface EnsembleConfig {
    apps: EnsembleAppConfig[];
    sharedEnv: Record<string, unknown>;
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
    },
});
