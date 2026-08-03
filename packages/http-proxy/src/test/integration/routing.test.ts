import assert from 'node:assert';
import http from 'node:http';
import tls from 'node:tls';

import { RoutingProxy } from '../../main/RoutingProxy.js';
import { ProxyUpstream } from '../../main/types.js';
import { certificate } from '../certs.js';
import { HTTP_PORT, HTTPS_PORT } from '../env.js';
import { connectThroughProxy, proxyOrigin, testFetch } from '../fetch.js';
import { UpstreamProxy } from '../upstream.js';

describe('Routing Proxy', () => {

    const fooProxy = new UpstreamProxy();
    beforeEach(() => fooProxy.start(0));
    beforeEach(() => fooProxy.reset());
    afterEach(() => fooProxy.shutdown(true));

    const barProxy = new UpstreamProxy();
    beforeEach(() => barProxy.start(0));
    beforeEach(() => barProxy.reset());
    afterEach(() => barProxy.shutdown(true));

    const routingProxy = new RoutingProxy();
    beforeEach(() => routingProxy.start(0));
    beforeEach(() => {
        routingProxy.clearRoutes();
        routingProxy.insertRoute({
            hostPattern: /^foo\.local:\d+$/.source,
            upstream: {
                host: `localhost:${fooProxy.getServerPort()}`,
            },
        });
        routingProxy.insertRoute({
            hostPattern: /^bar\.local:\d+$/.source,
            upstream: {
                host: `localhost:${barProxy.getServerPort()}`,
            },
        });
    });
    afterEach(() => routingProxy.shutdown(true));

    describe('http', () => {

        it('routes foo.local to foo upstream', async () => {
            const res = await testFetch(`http://foo.local:${HTTP_PORT}/foo`, {
                proxy: proxyOrigin(routingProxy.getServerPort()),
            });
            assert.strictEqual(res.text, 'You requested GET /foo over http');
            assert.ok(fooProxy.interceptedHttpRequest);
            assert.strictEqual(
                fooProxy.interceptedHttpRequest?.url,
                `http://foo.local:${HTTP_PORT}/foo`,
            );
            assert(barProxy.interceptedHttpRequest == null);
        });

        it('routes bar.local to bar upstream', async () => {
            const res = await testFetch(`http://bar.local:${HTTP_PORT}/foo`, {
                proxy: proxyOrigin(routingProxy.getServerPort()),
            });
            assert.strictEqual(res.text, 'You requested GET /foo over http');
            assert.ok(barProxy.interceptedHttpRequest);
            assert.strictEqual(
                barProxy.interceptedHttpRequest?.url,
                `http://bar.local:${HTTP_PORT}/foo`,
            );
            assert(fooProxy.interceptedHttpRequest == null);
        });

        it('routes unmatched requests directly', async () => {
            const res = await testFetch(`http://localhost:${HTTP_PORT}/foo`, {
                proxy: proxyOrigin(routingProxy.getServerPort()),
            });
            assert.strictEqual(res.text, 'You requested GET /foo over http');
            assert(fooProxy.interceptedHttpRequest == null);
            assert(barProxy.interceptedHttpRequest == null);
        });

    });

    describe('https', () => {

        it('routes foo.local to foo upstream', async () => {
            const res = await testFetch(`https://foo.local:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(routingProxy.getServerPort()),
                ca: certificate,
            });
            assert.strictEqual(res.text, 'You requested GET /foo over https');
            assert.ok(fooProxy.interceptedConnectRequest);
            assert.strictEqual(
                fooProxy.interceptedConnectRequest?.url,
                `foo.local:${HTTPS_PORT}`,
            );
            assert(barProxy.interceptedConnectRequest == null);
        });

        it('routes bar.local to bar upstream', async () => {
            const res = await testFetch(`https://bar.local:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(routingProxy.getServerPort()),
                ca: certificate,
            });
            assert.strictEqual(res.text, 'You requested GET /foo over https');
            assert.ok(barProxy.interceptedConnectRequest);
            assert.strictEqual(
                barProxy.interceptedConnectRequest?.url,
                `bar.local:${HTTPS_PORT}`,
            );
            assert(fooProxy.interceptedConnectRequest == null);
        });

        it('routes unmatched requests directly', async () => {
            const res = await testFetch(`https://localhost:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(routingProxy.getServerPort()),
                ca: certificate,
            });
            assert.strictEqual(res.text, 'You requested GET /foo over https');
            assert(fooProxy.interceptedConnectRequest == null);
            assert(barProxy.interceptedConnectRequest == null);
        });

        it('tracks established SSL connections', async () => {
            assert.strictEqual(routingProxy.trackedConnections.size, 0);
            assert.strictEqual(fooProxy.trackedConnections.size, 0);
            const target = new URL(`https://foo.local:${HTTPS_PORT}/foo`);
            const proxy = new URL(proxyOrigin(routingProxy.getServerPort()));
            const connectSocket = await connectThroughProxy(target, proxy);
            const tlsSocket = tls.connect({
                socket: connectSocket,
                host: target.hostname,
                servername: target.hostname,
                ca: certificate,
                ALPNProtocols: ['http/1.1'],
            });
            await new Promise<void>((resolve, reject) => {
                tlsSocket.once('secureConnect', () => resolve());
                tlsSocket.once('error', reject);
            });
            tlsSocket.write([
                'POST /foo HTTP/1.1',
                `Host: ${target.host}`,
                'Content-Length: 9',
                'Connection: keep-alive',
                '',
                'Some body',
            ].join('\r\n'));
            await new Promise<void>(resolve => {
                tlsSocket.once('data', () => resolve());
            });
            assert.strictEqual(routingProxy.trackedConnections.size, 1);
            assert.strictEqual(fooProxy.trackedConnections.size, 1);
            assert.strictEqual(barProxy.trackedConnections.size, 0);
            const connectionId = routingProxy.trackedConnections.keys().next().value!;
            assert.ok(fooProxy.trackedConnections.get(connectionId));
            await new Promise(r => {
                tlsSocket.on('close', r);
                tlsSocket.end();
            });
            const timeoutAt = Date.now() + 1000;
            while (Date.now() < timeoutAt) {
                await new Promise(r => setTimeout(r, 1));
                const totalConnectionsSize =
                    routingProxy.trackedConnections.size +
                    fooProxy.trackedConnections.size +
                    barProxy.trackedConnections.size;
                if (totalConnectionsSize === 0) {
                    return;
                }
            }
            throw new Error('Expected all connections to close');
        });

        it('calculates byte stats', async () => {
            assert.strictEqual(routingProxy.stats.bytesRead, 0);
            assert.strictEqual(routingProxy.stats.bytesWritten, 0);
            await testFetch(`https://foo.local:${HTTPS_PORT}/foo`, {
                proxy: proxyOrigin(routingProxy.getServerPort()),
                ca: certificate,
            });
            assert(routingProxy.stats.bytesRead > 100);
            assert(routingProxy.stats.bytesWritten > 100);
            const upstreamUrl = `http://@localhost:${fooProxy.getServerPort()}`;
            const stats = routingProxy.upstreamStats.get(upstreamUrl)!;
            assert(stats.bytesRead > 100);
            assert(stats.bytesWritten > 100);
            await routingProxy.shutdown(true);
            await routingProxy.start(0);
            assert.strictEqual(routingProxy.stats.bytesRead, 0);
            assert.strictEqual(routingProxy.stats.bytesWritten, 0);
        });

        describe('partitionId', () => {

            const partitionProxy = new (class extends RoutingProxy {
                override matchRoute() {
                    return { host: `localhost:${routingProxy.getServerPort()}` };
                }

                override createConnectRequest(
                    inboundConnectReq: http.IncomingMessage,
                    upstream: ProxyUpstream,
                ): http.ClientRequest {
                    const req = super.createConnectRequest(inboundConnectReq, upstream);
                    req.setHeader('x-partition-id', 'Hola Amigo');
                    return req;
                }
            })();
            beforeEach(() => partitionProxy.start(0));
            afterEach(() => partitionProxy.shutdown(true));

            it('propagates x-partition-id header to upstreams', async () => {
                const res = await testFetch(`https://foo.local:${HTTPS_PORT}/foo`, {
                    proxy: proxyOrigin(partitionProxy.getServerPort()),
                    ca: certificate,
                });
                assert.strictEqual(res.text, 'You requested GET /foo over https');
                assert.ok(fooProxy.interceptedConnectRequest);
                assert.strictEqual(
                    fooProxy.interceptedConnectRequest.headers['x-partition-id'],
                    'Hola Amigo',
                );
            });

        });

    });

});
