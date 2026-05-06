import assert from 'assert';

import { runtime } from './runtime.js';

describe('WsProtocolHandler', () => {

    beforeEach(() => runtime.setup());

    afterEach(() => runtime.afterEach());

    it('responds to RPC method requests', async () => {
        runtime.ws!.emit('message', JSON.stringify({
            id: 1,
            domain: 'Test',
            method: 'getVersion',
            params: {},
        }));
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.deepStrictEqual(JSON.parse(runtime.ws!.sent[0]), {
            id: 1,
            result: { version: '1.2.3' },
        });
    });

    it('emits accepted events from a pluggable event source', () => {
        runtime.events!.emitProtocolEvent('Test', 'updated', { name: 'Ada' }, 'client:one');
        runtime.events!.emitProtocolEvent('Test', 'updated', { name: 'Grace' }, 'client:two');
        assert.deepStrictEqual(JSON.parse(runtime.ws!.sent[0]), {
            domain: 'Test',
            event: 'updated',
            data: { name: 'Ada' },
        });
        assert.strictEqual(runtime.ws!.sent.length, 1);
    });

});
