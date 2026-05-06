import { type HttpContext } from '@flexent/http-server';
import { type Logger } from '@flexent/logger';
import {
    type ProtocolIndex,
    resolveRpcEventMessage,
    type RpcEvent,
    type RpcEventEnvelope,
    type RpcEventMessage,
    type RpcEventSource,
    RpcHandler,
    type RpcMethodResponse,
} from '@flexent/protocomm';
import { dep } from 'mesh-ioc';

const OPEN_READY_STATE = 1;

export interface WsProtocolData {
    toString(): string;
}

export interface WsProtocolConnection {
    readyState: number;
    send(data: string): void;
    on(event: 'message', listener: (data: WsProtocolData) => void): unknown;
    on(event: 'close', listener: () => void): unknown;
    on(event: 'error', listener: (error: unknown) => void): unknown;
}

export abstract class WsProtocolHandler<P, Target = unknown> {

    @dep({ key: 'ws' }) protected ws!: WsProtocolConnection;
    @dep() protected logger!: Logger;

    protected handler!: RpcHandler<P>;
    protected httpContext?: HttpContext;

    abstract get protocol(): ProtocolIndex<P>;

    abstract get protocolImpl(): P;

    protected get eventSource(): RpcEventSource<Target> | null {
        return null;
    }

    init(): void {
        this.handler = new RpcHandler(
            this.protocol,
            this.protocolImpl,
            res => this.sendResponse(res),
            evt => this.sendEvent(evt),
        );
        this.eventSource?.rpcEvent.on(message => this.onRpcEvent(message), this);
        this.ws.on('message', data => this.onMessage(data));
        this.ws.on('close', () => this.onClose());
        this.ws.on('error', error => this.onError(error));
    }

    setHttpContext(ctx: HttpContext): void {
        this.httpContext = ctx;
    }

    protected async onMessage(data: WsProtocolData): Promise<void> {
        try {
            await this.handler.processMessage(data.toString());
        } catch (error) {
            this.logger.error('Failed to process WS message', { error });
        }
    }

    protected onRpcEvent(message: RpcEventMessage<Target>): void {
        const envelope = resolveRpcEventMessage(message);
        if (this.acceptsEvent(envelope)) {
            this.sendEvent(envelope.event);
        }
    }

    protected acceptsEvent(envelope: RpcEventEnvelope<Target>): boolean {
        void envelope;
        return true;
    }

    protected sendResponse(res: RpcMethodResponse): void {
        this.send(res);
    }

    protected sendEvent(evt: RpcEvent): void {
        this.send(evt);
    }

    protected send(payload: unknown): void {
        if (this.ws.readyState === OPEN_READY_STATE) {
            this.ws.send(JSON.stringify(payload));
        }
    }

    protected onClose(): void {
        this.eventSource?.rpcEvent.removeAll(this);
        this.handler.methodStats.removeAll(this);
        this.logger.debug('WS connection closed');
    }

    protected onError(error: unknown): void {
        this.logger.error('WS error', { error });
    }

}
