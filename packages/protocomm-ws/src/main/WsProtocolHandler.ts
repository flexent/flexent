import { type HttpContext } from '@flexent/http-server';
import { type Logger } from '@flexent/logger';
import {
    type ProtocolIndex,
    type RpcEvent,
    RpcHandler,
    type RpcMethodResponse,
} from '@flexent/protocomm';
import { dep } from 'mesh-ioc';
import { type Event } from 'nanoevent';

const OPEN_READY_STATE = 1;

export interface WsProtocolConnection {
    readyState: number;
    send(data: string | Buffer): void;
    on(event: 'message', listener: (data: string | Buffer) => void): unknown;
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

    abstract get eventBus(): Event<RpcEvent<Target>>;

    init() {
        this.handler = new RpcHandler(
            this.protocol,
            this.protocolImpl,
            res => this.sendResponse(res),
            evt => this.sendEvent(evt),
        );
        this.eventBus.on(event => this.onRpcEvent(event), this);
        this.ws.on('message', data => this.onMessage(data));
        this.ws.on('close', () => this.onClose());
        this.ws.on('error', error => this.onError(error));
    }

    setHttpContext(ctx: HttpContext) {
        this.httpContext = ctx;
    }

    protected async onMessage(data: string | Buffer) {
        try {
            await this.handler.processMessage(data.toString());
        } catch (error) {
            this.logger.error('Failed to process WS message', { error });
        }
    }

    protected onRpcEvent(event: RpcEvent<Target>) {
        if (this.acceptsEvent(event)) {
            this.sendEvent(event);
        }
    }

    protected acceptsEvent(event: RpcEvent<Target>) {
        void event;
        return true;
    }

    protected sendResponse(res: RpcMethodResponse) {
        this.send(res);
    }

    protected sendEvent(evt: RpcEvent) {
        this.send(evt);
    }

    protected send(payload: unknown) {
        if (this.ws.readyState === OPEN_READY_STATE) {
            this.ws.send(JSON.stringify(payload));
        }
    }

    protected onClose() {
        this.eventBus.removeAll(this);
        this.handler.methodStats.removeAll(this);
        this.logger.debug('WS connection closed');
    }

    protected onError(error: unknown) {
        this.logger.error('WS error', { error });
    }

}
