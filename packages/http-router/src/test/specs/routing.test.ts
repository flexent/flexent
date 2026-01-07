import assert from 'node:assert';

import { runtime } from '../runtime.js';

describe('routing', () => {

    beforeEach(async () => {
        await runtime.setup();
        await runtime.httpServer.start();
    });

    afterEach(async () => {
        await runtime.httpServer.stop();
    });

    it('matches GET', async () => {
        const res = await fetch(runtime.getUrl('/hello'));
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(await res.json(), { hello: 'World' });
    });

    it('matches POST', async () => {
        const res = await fetch(runtime.getUrl('/hello?age=30'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'John' }),
        });
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(await res.json(), { name: 'John', age: 30 });
    });

    describe('not found', () => {

        it('calls next when not found', async () => {
            const res = await fetch(runtime.getUrl('/not-found'));
            assert.strictEqual(res.status, 404);
        });

    });

});
