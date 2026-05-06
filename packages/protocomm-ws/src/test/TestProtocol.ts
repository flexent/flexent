import { type DomainDef, ProtocolIndex } from '@flexent/protocomm';
import { type Event } from 'nanoevent';

export interface TestDomain {
    getVersion(req: {}): Promise<{ version: string }>;
    updated: Event<{ name: string }>;
}

export interface TestProtocol {
    Test: TestDomain;
}

export const TestDomain: DomainDef<TestDomain> = {
    name: 'Test',
    methods: {
        getVersion: {
            type: 'query',
            params: {},
            returns: {
                version: { type: 'string' },
            },
        },
    },
    events: {
        updated: {
            params: {
                name: { type: 'string' },
            },
        },
    },
};

export const protocol = new ProtocolIndex<TestProtocol>({
    Test: TestDomain,
});
