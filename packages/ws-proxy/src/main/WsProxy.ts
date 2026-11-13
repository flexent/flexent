import { IncomingMessage, STATUS_CODES } from 'node:http';
import { Duplex } from 'node:stream';

import { WsProxyError } from './errors.js';
import { OutboundUpgradeOptions, WsProxyContext, WsProxyRelay } from './types.js';
import { pipeBidirectional } from './util/pipe.js';

const FORWARDED_HEADER_NAMES = [
    'connection',
    'upgrade',
    'sec-websocket-key',
    'sec-websocket-version',
    'sec-websocket-protocol',
    'sec-websocket-extensions',
    'origin',
    'pragma',
    'cache-control',
];

export abstract class WsProxy {

    onUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
        this.onUpgradeInternal(request, socket, head).catch(() => {});
    }

    private async onUpgradeInternal(request: IncomingMessage, socket: Duplex, head: Buffer) {
        const ctx: WsProxyContext = { request, socket, head };
        try {
            socket.pause();
            this.assertWebSocketUpgrade(ctx);
            await this.runRelay(ctx);
        } catch (error: any) {
            this.onError(error, ctx);
        }
    }

    protected abstract processConnection(ctx: WsProxyContext): Promise<WsProxyRelay>;

    protected onConnected(
        _ctx: WsProxyContext,
        _outbound: Duplex,
    ): void {}

    protected onError(error: any, ctx: WsProxyContext): void {
        const status = error instanceof WsProxyError ? error.status : 502;
        const message = error?.message ?? 'WebSocket proxy failed';
        ctx.socket.resume();
        this.reject(ctx.socket, status, message);
    }

    protected encodeForwardedUpgrade(
        request: IncomingMessage,
        options: OutboundUpgradeOptions,
    ): string {
        const omitted = new Set((options.omitHeaders ?? []).map(name => name.toLowerCase()));
        const headers: Record<string, string | string[]> = {};
        for (const name of FORWARDED_HEADER_NAMES) {
            if (omitted.has(name)) {
                continue;
            }
            const value = request.headers[name];
            if (value == null) {
                continue;
            }
            headers[this.canonicalHeaderName(name)] = value;
        }
        if (options.host) {
            headers.Host = options.host;
        } else if (request.headers.host) {
            headers.Host = request.headers.host;
        }
        for (const [name, value] of Object.entries(options.headers ?? {})) {
            if (value == null) {
                delete headers[this.canonicalHeaderName(name)];
                continue;
            }
            headers[this.canonicalHeaderName(name)] = value;
        }
        const lines = [`GET ${options.path} HTTP/${request.httpVersion}`];
        for (const [name, value] of Object.entries(headers)) {
            if (Array.isArray(value)) {
                for (const item of value) {
                    lines.push(`${name}: ${item}`);
                }
            } else {
                lines.push(`${name}: ${value}`);
            }
        }
        return `${lines.join('\r\n')}\r\n\r\n`;
    }

    private async runRelay(ctx: WsProxyContext): Promise<void> {
        const relay = await this.processConnection(ctx);
        relay.outbound.write(this.encodeForwardedUpgrade(ctx.request, relay.upgrade));
        ctx.socket.resume();
        pipeBidirectional(ctx.socket, relay.outbound);
        if (ctx.head.length > 0) {
            queueMicrotask(() => relay.outbound.write(ctx.head));
        }
        this.onConnected(ctx, relay.outbound);
    }

    private assertWebSocketUpgrade(ctx: WsProxyContext): void {
        if (ctx.request.method !== 'GET') {
            throw new WsProxyError(400, 'Not a WebSocket upgrade request');
        }
        if (ctx.request.headers.upgrade?.toLowerCase() !== 'websocket') {
            throw new WsProxyError(400, 'Not a WebSocket upgrade request');
        }
        const connection = ctx.request.headers.connection?.toLowerCase() ?? '';
        if (!connection.split(',').some(part => part.trim() === 'upgrade')) {
            throw new WsProxyError(400, 'Not a WebSocket upgrade request');
        }
        const key = ctx.request.headers['sec-websocket-key'];
        if (!key || Array.isArray(key)) {
            throw new WsProxyError(400, 'Missing Sec-WebSocket-Key');
        }
    }

    private reject(socket: Duplex, status: number, message?: string): void {
        if (socket.destroyed || socket.writableEnded) {
            return;
        }
        const statusText = STATUS_CODES[status] ?? 'Error';
        const body = message ?? statusText;
        const payload = [
            `HTTP/1.1 ${status} ${statusText}`,
            'Connection: close',
            'Content-Type: text/plain; charset=utf-8',
            `Content-Length: ${Buffer.byteLength(body)}`,
            '',
            body,
        ].join('\r\n');
        socket.end(payload);
    }

    protected canonicalHeaderName(name: string): string {
        return name
            .split('-')
            .map(part => part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : part)
            .join('-');
    }

}
