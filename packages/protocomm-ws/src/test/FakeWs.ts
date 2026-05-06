import {
    type WsProtocolConnection,
    type WsProtocolData,
} from '../main/WsProtocolHandler.js';

type AnyListener = (...args: any[]) => void;

export class FakeWs implements WsProtocolConnection {

    readyState = 1;
    sent: string[] = [];
    private listeners = new Map<string, AnyListener[]>();

    send(data: string): void {
        this.sent.push(data);
    }

    on(event: 'message', listener: (data: WsProtocolData) => void): unknown;
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
