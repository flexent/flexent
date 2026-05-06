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
