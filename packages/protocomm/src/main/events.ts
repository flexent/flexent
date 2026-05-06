import { Event } from 'nanoevent';

import { type ProtocolIndex } from './protocol.js';
import { type RpcEvent } from './types.js';

export type ProtocolEventData<
    P,
    D extends keyof P,
    E extends keyof P[D],
> = P[D][E] extends Event<infer T> ? T : never;

export interface RpcEventEnvelope<Target = unknown> {
    event: RpcEvent;
    target?: Target;
}

export type RpcEventMessage<Target = unknown> = RpcEvent | RpcEventEnvelope<Target>;

export interface RpcEventSource<Target = unknown> {
    rpcEvent: Event<RpcEventMessage<Target>>;
}

export class ProtocolEventEmitter<P, Target = unknown> implements RpcEventSource<Target> {

    rpcEvent = new Event<RpcEventMessage<Target>>();

    constructor(
        readonly protocolIndex: ProtocolIndex<P>,
    ) {}

    emitEvent(event: RpcEvent, target?: Target): void {
        const { paramSchema } = this.protocolIndex.lookupEvent(event.domain, event.event);
        const message: RpcEventEnvelope<Target> = {
            event: {
                domain: event.domain,
                event: event.event,
                data: paramSchema.decode(event.data),
            },
            target,
        };
        this.rpcEvent.emit(message);
    }

    emitProtocolEvent<
        D extends keyof P & string,
        E extends keyof P[D] & string,
    >(domain: D, event: E, data: ProtocolEventData<P, D, E>, target?: Target): void {
        this.emitEvent({
            domain,
            event,
            data,
        }, target);
    }

}

export function resolveRpcEventMessage<Target>(
    message: RpcEventMessage<Target>,
): RpcEventEnvelope<Target> {
    const envelope = message as RpcEventEnvelope<Target>;
    if (typeof envelope.event === 'object' && envelope.event != null) {
        return envelope;
    }
    return {
        event: message as RpcEvent,
    };
}
