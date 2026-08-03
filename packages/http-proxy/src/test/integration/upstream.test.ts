import assert from 'node:assert';

import { certificate } from '../certs.js';
import { HTTP_PORT, HTTPS_PORT } from '../env.js';
import { proxyOrigin, testFetch } from '../fetch.js';
import { UpstreamProxy } from '../upstream.js';

describe('Upstream Proxy', () => {

    const upstreamProxy = new UpstreamProxy();

    beforeEach(() => upstreamProxy.start(0));
    beforeEach(() => upstreamProxy.reset());
    afterEach(() => upstreamProxy.shutdown(true));

    describe('http', () => {

        it('sends direct requests without proxy', async () => {
            const res = await testFetch(`http://localhost:${HTTP_PORT}/foo`);
            assert.strictEqual(res.text, 'You requested GET /foo over http');
            assert(upstreamProxy.interceptedHttpRequest == null);
        });

        it('sends GET through upstream proxy', async () => {
            const res = await testFetch(`http://localhost:${HTTP_PORT}/foo`, {
                proxy: proxyOrigin(upstreamProxy.getServerPort()),
            });
            assert.strictEqual(res.text, 'You requested GET /foo over http');
            assert.ok(upstreamProxy.interceptedHttpRequest);
            assert.strictEqual(
                upstreamProxy.interceptedHttpRequest?.url,
                `http://localhost:${HTTP_PORT}/foo`,
            );
        });

        it('sends POST through upstream proxy', async () => {
            const res = await testFetch(`http://localhost:${HTTP_PORT}/foo`, {
                proxy: proxyOrigin(upstreamProxy.getServerPort()),
                method: 'POST',
                body: 'Hello world!',
            });
            assert.strictEqual(res.text, 'You requested POST /foo over http\nHello world!');
            assert.ok(upstreamProxy.interceptedHttpRequest);
            assert.strictEqual(
                upstreamProxy.interceptedHttpRequest?.url,
                `http://localhost:${HTTP_PORT}/foo`,
            );
        });

    });

    describe('https', () => {

        it('sends direct requests without proxy', async () => {
            const res = await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                ca: certificate,
            });
            assert.strictEqual(res.text, 'You requested GET /foo over https');
            assert(upstreamProxy.interceptedHttpRequest == null);
        });

        it('sends GET through upstream proxy', async () => {
            const res = await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(upstreamProxy.getServerPort()),
                ca: certificate,
            });
            assert.strictEqual(res.text, 'You requested GET /foo over https');
            assert.ok(upstreamProxy.interceptedConnectRequest);
            assert.strictEqual(
                upstreamProxy.interceptedConnectRequest?.url,
                `localhost:${HTTPS_PORT}`,
            );
        });

        it('sends POST through upstream proxy', async () => {
            const res = await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(upstreamProxy.getServerPort()),
                ca: certificate,
                method: 'POST',
                body: 'Hello world!',
            });
            assert.strictEqual(res.text, 'You requested POST /foo over https\nHello world!');
            assert.ok(upstreamProxy.interceptedConnectRequest);
            assert.strictEqual(
                upstreamProxy.interceptedConnectRequest?.url,
                `localhost:${HTTPS_PORT}`,
            );
        });

        it('calculates byte stats', async () => {
            assert.strictEqual(upstreamProxy.stats.bytesRead, 0);
            assert.strictEqual(upstreamProxy.stats.bytesWritten, 0);
            await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(upstreamProxy.getServerPort()),
                ca: certificate,
                method: 'POST',
                body: 'Hello world!',
            });
            assert(upstreamProxy.stats.bytesRead > 100);
            assert(upstreamProxy.stats.bytesWritten > 100);
            await upstreamProxy.shutdown(true);
            await upstreamProxy.start(0);
            assert.strictEqual(upstreamProxy.stats.bytesRead, 0);
            assert.strictEqual(upstreamProxy.stats.bytesWritten, 0);
        });

    });

});
