import assert from 'node:assert/strict';
import { IncomingMessage } from 'node:http';
import { PassThrough } from 'node:stream';

import { WsProxy } from '../main/WsProxy.js';

describe('WsProxy', () => {

    it('rejects non-WebSocket upgrade requests', async () => {
        const proxy = new TestProxy();
        const socket = new PassThrough();
        const chunks: Buffer[] = [];
        socket.on('data', chunk => chunks.push(chunk));
        proxy.onUpgrade({
            method: 'GET',
            headers: { connection: 'keep-alive' },
        } as IncomingMessage, socket, Buffer.alloc(0));
        await new Promise<void>(resolve => socket.on('end', () => resolve()));
        assert.match(Buffer.concat(chunks).toString('utf8'), /400/);
    });

    it('encodes forwarded upgrade requests', () => {
        const proxy = new TestProxy();
        const payload = proxy.publicEncode({
            method: 'GET',
            httpVersion: '1.1',
            url: '/lease?sessionId=foo',
            headers: {
                host: 'browser.example',
                upgrade: 'websocket',
                connection: 'Upgrade',
                'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
                'sec-websocket-version': '13',
            },
        } as IncomingMessage, {
            path: '/lease?t=token',
            host: 'host.example',
        });
        assert.match(payload, /^GET \/lease\?t=token HTTP\/1\.1\r\n/);
        assert.match(payload, /Host: host\.example\r\n/i);
        assert.match(payload, /Sec-Websocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n/i);
    });

});

class TestProxy extends WsProxy {

    protected async processConnection(): Promise<{ outbound: PassThrough; upgrade: { path: string } }> {
        return {
            outbound: new PassThrough(),
            upgrade: { path: '/' },
        };
    }

    publicEncode(request: IncomingMessage, options: { path: string; host?: string }) {
        return this.encodeForwardedUpgrade(request, options);
    }

}
