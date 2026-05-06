import { type WsProtocolConnection } from '../main/WsProtocolHandler.js';

type AnyListener = (...args: any[]) => void;

export class FakeWs implements WsProtocolConnection {

    readyState = 1;
    sent: string[] = [];
    private listeners = new Map<string, AnyListener[]>();

    send(data: string | Buffer): void {
        this.sent.push(data.toString());
    }

    on(event: 'message', listener: (data: string | Buffer) => void): unknown;
    on(event: 'close', listener: () => void): unknown;
    on(event: 'error', listener: (error: unknown) => void): unknown;
    on(event: string, listener: AnyListener): unknown {
        const listeners = this.listeners.get(event) ?? [];
        listeners.push(listener);
        this.listeners.set(event, listeners);
        return this;
    }

    emit(event: string, data?: unknown): void {
        for (const listener of this.listeners.get(event) ?? []) {
            listener(data);
        }
    }

}
