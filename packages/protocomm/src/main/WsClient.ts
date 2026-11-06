import { Event } from 'nanoevent';

import { ProtocolIndex } from './ProtocolIndex.js';
import { RpcClient } from './RpcClient.js';
import { RpcMethodRequest } from './types.js';

const OPEN_READY_STATE = 1;

export type WsEventListener<T> = (event: T) => void;

export interface WsMessageEvent {
    data: unknown;
}

export interface WsConnection {
    readyState: number;
    addEventListener(type: 'open', listener: WsEventListener<unknown>): void;
    addEventListener(type: 'error', listener: WsEventListener<unknown>): void;
    addEventListener(type: 'message', listener: WsEventListener<WsMessageEvent>): void;
    addEventListener(type: 'close', listener: WsEventListener<unknown>): void;
    send(data: string): void;
    close(): void;
}

export abstract class WsClient<P> {

    connected = new Event<void>();
    disconnected = new Event<void>();

    protected ws: WsConnection | null = null;
    protected connectPromise: Promise<WsConnection> | null = null;
    protected reconnectEnabled = this.shouldReconnectOnClose();
    protected pendingRequests: RpcMethodRequest[] = [];

    protected _rpcClient: RpcClient<P> | null = null;

    protected abstract get url(): string;

    protected abstract get protocol(): ProtocolIndex<P>;

    protected get rpcClient(): RpcClient<P> {
        if (!this._rpcClient) {
            this._rpcClient = new RpcClient(this.protocol, req => this.sendRequest(req));
        }
        return this._rpcClient;
    }

    get client(): P {
        return this.rpcClient.client;
    }

    get isConnected(): boolean {
        const ws = this.ws;
        return !!ws && ws.readyState === OPEN_READY_STATE;
    }

    async connect(): Promise<WsConnection> {
        this.reconnectEnabled = this.shouldReconnectOnClose();
        if (!this.connectPromise) {
            this.connectPromise = this.makeConnection();
        }
        return await this.connectPromise;
    }

    disconnect() {
        this.reconnectEnabled = false;
        const ws = this.ws;
        this.ws = null;
        this.connectPromise = null;
        this.pendingRequests = [];
        this._rpcClient?.handleClose();
        if (ws) {
            ws.close();
        }
    }

    protected async makeConnection(): Promise<WsConnection> {
        let attempts = 0;
        while (true) {
            try {
                const ws = await this.tryConnect();
                ws.addEventListener('message', ev => this.onMessage(ev));
                ws.addEventListener('close', () => {
                    this.onClose(ws).catch(() => {});
                });
                this.ws = ws;
                this.connected.emit();
                this.flushPendingRequests();
                return ws;
            } catch (_err) {
                attempts++;
                if (!this.shouldRetry(attempts)) {
                    this.connectPromise = null;
                    this.pendingRequests = [];
                    this._rpcClient?.handleClose();
                    this.onConnectionFailed(attempts);
                    throw new Error('WebSocket connection failed');
                }
                await this.wait(this.getRetryIntervalMs());
            }
        }
    }

    protected tryConnect(): Promise<WsConnection> {
        const url = this.url;
        return new Promise<WsConnection>((resolve, reject) => {
            const ws = this.createConnection(url);
            ws.addEventListener('open', () => resolve(ws));
            ws.addEventListener('error', () => reject(new Error('WebSocket connection failed')));
        });
    }

    protected onMessage(ev: WsMessageEvent) {
        this.rpcClient.processMessage(ev.data);
    }

    protected async onClose(ws: WsConnection) {
        if (this.ws !== ws) {
            return;
        }
        const keepIds = this.reconnectEnabled ?
            new Set(this.pendingRequests.map(req => req.id)) :
            undefined;
        if (!this.reconnectEnabled) {
            this.pendingRequests = [];
        }
        this._rpcClient?.handleClose(keepIds);
        this.ws = null;
        this.disconnected.emit();
        this.connectPromise = null;
        if (!this.reconnectEnabled) {
            return;
        }
        await this.wait(this.getRetryIntervalMs());
        if (!this.reconnectEnabled) {
            return;
        }
        this.connectPromise = this.makeConnection();
        try {
            await this.connectPromise;
        } catch {
            // makeConnection already rejected queued commands
        }
    }

    protected sendRequest(req: RpcMethodRequest) {
        const ws = this.ws;
        if (ws && ws.readyState === OPEN_READY_STATE) {
            ws.send(JSON.stringify(req));
            return;
        }
        if (this.reconnectEnabled) {
            this.pendingRequests.push(req);
            return;
        }
        throw new Error('WebSocket not connected');
    }

    protected flushPendingRequests() {
        const ws = this.ws;
        if (!ws || ws.readyState !== OPEN_READY_STATE) {
            return;
        }
        const pending = this.pendingRequests;
        this.pendingRequests = [];
        for (const req of pending) {
            ws.send(JSON.stringify(req));
        }
    }

    protected requireWs(): WsConnection {
        const ws = this.ws;
        if (ws && ws.readyState === OPEN_READY_STATE) {
            return ws;
        }
        throw new Error('WebSocket not connected');
    }

    protected createConnection(url: string): WsConnection {
        return new WebSocket(url) as unknown as WsConnection;
    }

    protected shouldRetry(_attempt: number): boolean {
        return true;
    }

    protected getRetryIntervalMs(): number {
        const intervals = [500, 1000, 2000, 3000, 4000, 5000];
        return intervals[Math.floor(Math.random() * intervals.length)];
    }

    protected shouldReconnectOnClose(): boolean {
        return false;
    }

    protected onConnectionFailed(_attempt: number): void {
    }

    protected wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}
