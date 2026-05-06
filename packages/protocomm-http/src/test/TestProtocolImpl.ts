import { type Event } from 'nanoevent';

import { type TestProtocol } from './TestProtocol.js';

export const protocolImpl = {
    Test: {
        updated: {} as Event<{ name: string }>,
        async getVersion() {
            return { version: '1.2.3' };
        },
        async setName(req: { name: string }) {
            return { name: req.name };
        },
    },
} as TestProtocol;
