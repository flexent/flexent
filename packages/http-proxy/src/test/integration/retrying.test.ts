import assert from 'node:assert';

import { certificate } from '../certs.js';
import { HTTPS_PORT } from '../env.js';
import { proxyOrigin, testFetch } from '../fetch.js';
import { UpstreamProxy } from '../upstream.js';

describe('Retry on connect', () => {

    let upstream: UpstreamProxy;
    beforeEach(async () => {
        upstream = new UpstreamProxy();
        await upstream.start(0);
    });
    afterEach(() => upstream.shutdown(true));

    let proxy: UpstreamProxy;
    beforeEach(async () => {
        proxy = new UpstreamProxy();
        proxy.defaultUpstream = {
            host: `localhost:${upstream.getServerPort()}`,
        };
        await proxy.start(0);
    });
    afterEach(() => proxy.shutdown(true));

    context('on delay', () => {

        beforeEach(() => {
            upstream.delayOnConnect = 60000;
            proxy.connectRetryAttempts = 1;
            proxy.connectRetryInterval = 100;
        });

        it('retries upstream connection', async () => {
            setTimeout(() => {
                upstream.delayOnConnect = 0;
            }, 50);
            const res = await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(proxy.getServerPort()),
                ca: certificate,
            });
            assert.strictEqual(res.text, 'You requested GET /foo over https');
            assert.ok(upstream.interceptedConnectRequest);
            assert.strictEqual(upstream.interceptedConnectRequest?.url, `localhost:${HTTPS_PORT}`);
            assert.strictEqual(proxy.connectAttempts, 2);
            assert.strictEqual(upstream.connectAttempts, 1);
        });

        it('fails if runs out of attempts', async () => {
            proxy.connectTimeout = 100;
            proxy.connectRetryAttempts = 1;
            try {
                await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                    proxy: proxyOrigin(proxy.getServerPort()),
                    ca: certificate,
                });
                throw new Error('UnexpectedSuccess');
            } catch (err: unknown) {
                assert.notStrictEqual((err as Error).message, 'UnexpectedSuccess');
                assert.strictEqual(proxy.connectAttempts, 2);
                assert.strictEqual(upstream.connectAttempts, 0);
            }
        });

    });

    context('on error', () => {

        beforeEach(() => {
            upstream.errorOnConnect = new Error('Boom');
            proxy.connectRetryAttempts = 1;
            proxy.connectRetryInterval = 100;
        });

        it('retries upstream connection', async () => {
            setTimeout(() => {
                upstream.errorOnConnect = null;
            }, 50);
            const res = await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(proxy.getServerPort()),
                ca: certificate,
            });
            assert.strictEqual(res.text, 'You requested GET /foo over https');
            assert.ok(upstream.interceptedConnectRequest);
            assert.strictEqual(upstream.interceptedConnectRequest?.url, `localhost:${HTTPS_PORT}`);
            assert.strictEqual(proxy.connectAttempts, 2);
            assert.strictEqual(upstream.connectAttempts, 1);
        });

        it('fails if runs out of attempts', async () => {
            proxy.connectRetryAttempts = 1;
            try {
                await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                    proxy: proxyOrigin(proxy.getServerPort()),
                    ca: certificate,
                });
                throw new Error('UnexpectedSuccess');
            } catch (err: unknown) {
                assert.notStrictEqual((err as Error).message, 'UnexpectedSuccess');
                assert.strictEqual(proxy.connectAttempts, 2);
                assert.strictEqual(upstream.connectAttempts, 0);
            }
        });

    });

});
