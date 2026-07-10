import { IncomingMessage } from 'node:http';
import { Duplex } from 'node:stream';

export interface WsProxyContext {
    readonly request: IncomingMessage;
    readonly socket: Duplex;
    readonly head: Buffer;
}

export interface OutboundUpgradeOptions {
    path: string;
    host?: string;
    headers?: Record<string, string | string[]>;
    omitHeaders?: string[];
}

export interface WsProxyRelay {
    outbound: Duplex;
    upgrade: OutboundUpgradeOptions;
}
