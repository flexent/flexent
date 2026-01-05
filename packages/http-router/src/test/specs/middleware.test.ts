import assert from 'node:assert';

import { runtime } from '../runtime.js';

describe('middleware', () => {

    beforeEach(async () => {
        await runtime.setup();
        await runtime.httpServer.start();
    });

    afterEach(async () => {
        await runtime.httpServer.stop();
    });

    it('applies middleware in order defined in class', async () => {
        const res = await fetch(runtime.getUrl('/hello'));
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.headers.get('x-middleware'), 'one, two');
    });

    it('applies middleware in inherited classes', async () => {
        const res = await fetch(runtime.getUrl('/inherited'));
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(await res.json(), { inherited: 123 });
        assert.strictEqual(res.headers.get('x-middleware'), 'base, inherited');
    });

});
