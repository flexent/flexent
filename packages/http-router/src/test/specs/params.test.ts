import assert from 'node:assert';

import { runtime } from '../runtime.js';

describe('params', () => {

    beforeEach(async () => {
        await runtime.setup();
        await runtime.httpServer.start();
    });

    afterEach(async () => {
        await runtime.httpServer.stop();
    });

    it('captures path parameters', async () => {
        const res = await fetch(runtime.getUrl('/params/path/foo/42/true'));
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(await res.json(), { str: 'foo', num: 42, bool: true });
    });

    it('captures query parameters', async () => {
        const url = runtime.getUrl('/params/query?str=foo&num=123&bool=true&arr=one&arr=two&obj={"foo":"bar"}');
        const res = await fetch(url);
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

    describe('optional', () => {

        it('undefined when not provided', async () => {
            const res = await fetch(runtime.getUrl('/params/optional'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), {});
        });

        it('uses actual value when provided', async () => {
            const res = await fetch(runtime.getUrl('/params/optional?str=foo'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), { str: 'foo' });
        });

    });

    describe('nullable', () => {

        it('null when not provided', async () => {
            const res = await fetch(runtime.getUrl('/params/nullable'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), { str: null });
        });

        it('uses actual value when provided', async () => {
            const res = await fetch(runtime.getUrl('/params/nullable?str=foo'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), { str: 'foo' });
        });

    });

    describe('default', () => {

        it('uses default when not provided', async () => {
            const res = await fetch(runtime.getUrl('/params/default'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), { str: 'Hello' });
        });

        it('uses actual value when provided', async () => {
            const res = await fetch(runtime.getUrl('/params/default?str=foo'));
            assert.strictEqual(res.status, 200);
            assert.deepStrictEqual(await res.json(), { str: 'foo' });
        });

    });

});
