import assert from 'assert';

import { runtime } from './runtime.js';

describe('HttpProtocolHandler', () => {

    beforeEach(() => runtime.setup());

    afterEach(() => runtime.afterEach());

    it('routes query methods via GET', async () => {
        const ctx: any = {
            path: '/Test/getVersion',
            method: 'GET',
            query: {},
            state: {},
        };
        await runtime.handler!.handle(ctx, async () => {
            throw new Error('next should not be called');
        });
        assert.strictEqual(ctx.status, 200);
        assert.deepStrictEqual(ctx.responseBody, { version: '1.2.3' });
        assert.strictEqual(ctx.state.domainName, 'Test');
        assert.strictEqual(ctx.state.methodName, 'getVersion');
    });

    it('routes command methods via POST', async () => {
        const ctx: any = {
            path: '/Test/setName',
            method: 'POST',
            query: {},
            state: {},
            async readRequestBody() {
                return { name: 'Ada' };
            },
        };
        await runtime.handler!.handle(ctx, async () => {
            throw new Error('next should not be called');
        });
        assert.strictEqual(ctx.status, 200);
        assert.deepStrictEqual(ctx.responseBody, { name: 'Ada' });
    });

    it('delegates when the HTTP method does not match the protocol method type', async () => {
        const ctx: any = {
            path: '/Test/setName',
            method: 'GET',
            query: {},
            state: {},
        };
        let nextCalled = false;
        await runtime.handler!.handle(ctx, async () => {
            nextCalled = true;
        });
        assert.strictEqual(nextCalled, true);
    });

});
