import assert from 'node:assert';

import { SslBumpProxy } from '../../main/SslBumpProxy.js';
import { certificate, privateKey } from '../certs.js';
import { HTTPS_PORT } from '../env.js';
import { proxyOrigin, testFetch } from '../fetch.js';
import { UpstreamProxy } from '../upstream.js';

describe('SSL Bumping', () => {

    const upstreamProxy = new UpstreamProxy();

    beforeEach(() => upstreamProxy.start(0));
    beforeEach(() => upstreamProxy.reset());
    afterEach(() => upstreamProxy.shutdown(true));

    describe('passthrough', () => {

        const sslBumpProxy = new SslBumpProxy({
            // Same keys/certs for testing; in production these should differ.
            caCert: certificate,
            caPrivateKey: privateKey,
            certCacheMaxEntries: 100,
            certTtlDays: 365,
        });
        beforeEach(() => sslBumpProxy.start(0));
        afterEach(() => sslBumpProxy.shutdown(true));

        async function sendRequestsWithAssertions() {
            const proxy = proxyOrigin(sslBumpProxy.getServerPort());
            const res1 = await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                proxy,
                ca: certificate,
            });
            assert.strictEqual(res1.text, 'You requested GET /foo over https');
            const res2 = await testFetch(`https://localhost:${HTTPS_PORT}/bar`, {
                proxy,
                ca: certificate,
                method: 'POST',
                body: 'Hello world!',
            });
            assert.strictEqual(res2.text, 'You requested POST /bar over https\nHello world!');
        }

        context('direct connection', () => {
            beforeEach(() => {
                sslBumpProxy.defaultUpstream = null;
            });

            it('returns remote response', async () => {
                await sendRequestsWithAssertions();
                assert(upstreamProxy.interceptedConnectRequest == null);
            });
        });

        context('connection via upstream proxy', () => {
            beforeEach(() => {
                sslBumpProxy.defaultUpstream = {
                    host: `localhost:${upstreamProxy.getServerPort()}`,
                };
            });

            it('returns remote response through proxy', async () => {
                await sendRequestsWithAssertions();
                assert.strictEqual(
                    upstreamProxy.interceptedConnectRequest?.url,
                    `localhost:${HTTPS_PORT}`,
                );
            });
        });

    });

});
