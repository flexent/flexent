import { Event } from 'nanoevent';

export const protocolImpl = {
    Test: {
        updated: new Event<{ name: string }>(),
        async getVersion() {
            return { version: '1.2.3' };
        },
    },
};
