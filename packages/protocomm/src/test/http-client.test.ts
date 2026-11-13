import assert from 'assert';

import { HttpRequestError } from '../main/errors.js';
import { FetchOptions, HttpClient } from '../main/HttpClient.js';
import { Protocol, protocolIndex } from './protocol.js';

interface FetchCall {
    url: string;
    options?: FetchOptions;
}

class FakeFetch {

    calls: FetchCall[] = [];
    response = new Response('{}');

    fetch = async (url: string, options?: FetchOptions) => {
        this.calls.push({
            url,
            options,
        });
        return this.response;
    };

}

describe('HttpClient', () => {

    let fake: FakeFetch;
    let client: Protocol;

    beforeEach(() => {
        fake = new FakeFetch();
        client = new HttpClient(protocolIndex, {
            baseUrl: 'http://api.test/rpc',
            fetch: fake.fetch,
            headers: { authorization: 'Bearer x' },
        }).client;
    });

    it('sends queries as GET with query parameters', async () => {
        fake.response = Response.json({ instances: [] });
        const res = await client.Heartbeat.getGroup({ group: 'web' });
        assert.deepStrictEqual(res, { instances: [] });
        assert.strictEqual(fake.calls[0].url, 'http://api.test/rpc/Heartbeat/getGroup?group=web');
        assert.strictEqual(fake.calls[0].options?.method, 'GET');
        assert.strictEqual(fake.calls[0].options?.body, undefined);
        assert.strictEqual(fake.calls[0].options?.headers?.authorization, 'Bearer x');
    });

    it('sends commands as POST with a JSON body', async () => {
        await client.Heartbeat.deleteInstance({
            group: 'web',
            id: 'one',
        });
        assert.strictEqual(fake.calls[0].url, 'http://api.test/rpc/Heartbeat/deleteInstance');
        assert.strictEqual(fake.calls[0].options?.method, 'POST');
        assert.deepStrictEqual(JSON.parse(fake.calls[0].options?.body), {
            group: 'web',
            id: 'one',
        });
    });

    it('throws the error a protocol response describes', async () => {
        fake.response = Response.json({
            name: 'NotFoundError',
            message: 'Group not found',
            details: { group: 'web' },
        }, { status: 404 });
        await assert.rejects(client.Heartbeat.getGroup({ group: 'web' }), (error: any) => {
            assert.strictEqual(error.name, 'NotFoundError');
            assert.strictEqual(error.message, 'Group not found');
            assert.deepStrictEqual(error.details, { group: 'web' });
            assert.strictEqual(error.status, 404);
            return true;
        });
    });

    it('throws HttpRequestError with the body of any other failed response', async () => {
        fake.response = new Response('Bad Gateway', { status: 502 });
        await assert.rejects(client.System.getVersion({}), (error: any) => {
            assert.ok(error instanceof HttpRequestError);
            assert.strictEqual(error.message, '502 - GET http://api.test/rpc/System/getVersion');
            assert.deepStrictEqual(error.details, { response: 'Bad Gateway' });
            return true;
        });
    });

});
