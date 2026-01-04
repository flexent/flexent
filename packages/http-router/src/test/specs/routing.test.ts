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

    describe('matching', () => {

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
            assert.deepStrictEqual(await res.json(), { hello: 'John', age: 30 });
        });

    });

    describe('params', () => {

        it('captures path parameters', async () => {
            const res = await fetch(runtime.getUrl('/params/path/foo/42/true'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), { str: 'foo', num: 42, bool: true });
        });

        it('captures query parameters', async () => {
            const res = await fetch(runtime.getUrl('/params/query?str=foo&num=123&bool=true&arr=one&arr=two&obj={"foo":"bar"}'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), {
                str: 'foo',
                num: 123,
                bool: true,
                arr: ['one', 'two'],
                obj: { foo: 'bar' },
            });
        });

        it('captures header parameters', async () => {
            const res = await fetch(runtime.getUrl('/params/header'), {
                headers: {
                    'X-Str': 'foo',
                    'X-Num': '123',
                    'X-Bool': 'true',
                    'X-Arr': '["one","two"]',
                    'X-Obj': '{"foo":"bar"}',
                },
            });
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), {
                str: 'foo',
                num: 123,
                bool: true,
                arr: ['one', 'two'],
                obj: { foo: 'bar' },
            });
        });

        it('captures json body parameters', async () => {
            const res = await fetch(runtime.getUrl('/params/body'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    str: 'foo',
                    num: 123,
                    bool: true,
                    arr: ['one', 'two'],
                    obj: { foo: 'bar' },
                }),
            });
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), {
                str: 'foo',
                num: 123,
                bool: true,
                arr: ['one', 'two'],
                obj: { foo: 'bar' },
            });
        });

        it('captures form body parameters', async () => {
            const res = await fetch(runtime.getUrl('/params/body'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'str=foo&num=123&bool=true&arr=["one","two"]&obj={"foo":"bar"}',
            });
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), {
                str: 'foo',
                num: 123,
                bool: true,
                arr: ['one', 'two'],
                obj: { foo: 'bar' },
            });
        });

        it('captures whole request body', async () => {
            const res = await fetch(runtime.getUrl('/params/body/json'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    str: 'foo',
                    num: 123,
                    bool: true,
                    arr: ['one', 'two'],
                    obj: { foo: 'bar' },
                }),
            });
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), {
                str: 'foo',
                num: 123,
                bool: true,
                arr: ['one', 'two'],
                obj: { foo: 'bar' },
            });
        });

        it('validates whole request body as JSON', async () => {
            const res = await fetch(runtime.getUrl('/params/body/json'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            assert.strictEqual(res.status, 400);
            const body = await res.json();
            assert.strictEqual(body.name, 'ValidationError');
        });

    });

    describe('middleware', () => {

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

});
