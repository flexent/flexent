import assert from 'assert';
import { Event } from 'nanoevent';

import { RpcEventProducer } from '../main/RpcEventProducer.js';
import { RpcEvent } from '../main/types.js';

interface TestDomain {
    updated: Event<{ id: string }>;
}

interface TestProtocol {
    Test: TestDomain;
}

class TestEventProducer extends RpcEventProducer<TestProtocol, string> {

    events: RpcEvent<string>[] = [];

    produceEvent(event: RpcEvent<string>) {
        this.events.push(event);
    }

}

describe('RpcEventProducer', () => {

    it('produces typed protocol events', async () => {
        const events = new TestEventProducer();
        await events.broadcast('Test', 'updated', { id: 'one' }, 'client:one');
        assert.deepStrictEqual(events.events, [{
            domain: 'Test',
            event: 'updated',
            data: { id: 'one' },
            target: 'client:one',
        }]);
    });

});
