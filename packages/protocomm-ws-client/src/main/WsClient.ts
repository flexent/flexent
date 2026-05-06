import { type ProtocolIndex, RpcClient, type RpcMethodRequest } from '@flexent/protocomm';
import { Event } from 'nanoevent';

import { type WsConnection, type WsMessageEvent } from './types.js';

const OPEN_READY_STATE = 1;

export abstract class WsClient<P> {

    connected = new Event<void>();
    disconnected = new Event<void>();

    protected ws: WsConnection | null = null;
    protected connectPromise: Promise<WsConnection> | null = null;
    protected reconnectEnabled = this.shouldReconnectOnClose();

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
        if (this.ws) {
            this.ws.close();
        }
        this.ws = null;
        this.connectPromise = null;
    }

    protected async makeConnection(): Promise<WsConnection> {
        let attempts = 0;
        while (true) {
            try {
                const ws = await this.tryConnect();
                ws.addEventListener('message', ev => this.onMessage(ev));
                ws.addEventListener('close', () => this.onClose());
                this.ws = ws;
                this.connected.emit();
                return ws;
            } catch (_err) {
                attempts++;
                if (!this.shouldRetry(attempts)) {
                    this.connectPromise = null;
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

    protected async onClose() {
        this.rpcClient.handleClose();
        this.ws = null;
        this.disconnected.emit();
        this.connectPromise = null;
        if (this.reconnectEnabled) {
            await this.wait(this.getRetryIntervalMs());
            this.connectPromise = this.makeConnection();
        }
    }

    protected sendRequest(req: RpcMethodRequest) {
        const ws = this.requireWs();
        ws.send(JSON.stringify(req));
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

    protected shouldRetry(attempt: number): boolean {
        void attempt;
        return true;
    }

    protected getRetryIntervalMs(): number {
        const intervals = [500, 1000, 2000, 3000, 4000, 5000];
        return intervals[Math.floor(Math.random() * intervals.length)];
    }

    protected shouldReconnectOnClose(): boolean {
        return false;
    }

    protected onConnectionFailed(attempt: number): void {
        void attempt;
    }

    protected wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}
