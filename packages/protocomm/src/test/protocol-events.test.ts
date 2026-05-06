import assert from 'assert';
import { type Event } from 'nanoevent';

import { type DomainDef } from '../main/domain.js';
import { ProtocolEventEmitter } from '../main/events.js';
import { ProtocolIndex } from '../main/protocol.js';

interface TestDomain {
    updated: Event<{ id: string }>;
}

interface TestProtocol {
    Test: TestDomain;
}

const TestDomain: DomainDef<TestDomain> = {
    name: 'Test',
    methods: {},
    events: {
        updated: {
            params: {
                id: { type: 'string' },
            },
        },
    },
};

describe('ProtocolEventEmitter', () => {

    it('emits schema-validated protocol events', () => {
        const protocolIndex = new ProtocolIndex<TestProtocol>({
            Test: TestDomain,
        });
        const events = new ProtocolEventEmitter<TestProtocol, string>(protocolIndex);
        const emitted: unknown[] = [];
        events.rpcEvent.on(evt => emitted.push(evt));
        events.emitProtocolEvent('Test', 'updated', { id: 'one' }, 'client:one');
        assert.deepStrictEqual(emitted, [{
            event: {
                domain: 'Test',
                event: 'updated',
                data: { id: 'one' },
            },
            target: 'client:one',
        }]);
    });

});
