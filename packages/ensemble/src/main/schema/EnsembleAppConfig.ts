import { Schema } from 'airtight';

export interface EnsembleAppConfig {
    id: string;
    dir: string;
    entrypoint: string;
    waitForPorts?: unknown[];
    nodeFlags?: string[];
    args?: string[];
    env?: Record<string, string>;
}

export const EnsembleAppConfigSchema = new Schema<EnsembleAppConfig>({
    type: 'object',
    properties: {
        id: { type: 'string' },
        dir: { type: 'string' },
        entrypoint: { type: 'string' },
        waitForPorts: {
            type: 'array',
            items: { type: 'any' },
            optional: true,
        },
        nodeFlags: {
            type: 'array',
            items: { type: 'string' },
            optional: true,
        },
        args: {
            type: 'array',
            items: { type: 'string' },
            optional: true,
        },
        env: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'string' },
            optional: true,
        },
    },
});
