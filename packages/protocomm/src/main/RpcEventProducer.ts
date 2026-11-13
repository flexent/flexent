import { ProtocolEventData, RpcEvent } from './types.js';

/** A typed protocol event to broadcast, optionally to one target. */
export interface RpcBroadcast<P, D extends keyof P & string, E extends keyof P[D] & string, Target = unknown> {
    domain: D;
    event: E;
    data: ProtocolEventData<P, D, E>;
    target?: Target;
}

export abstract class RpcEventProducer<P, Target = unknown> {

    abstract produceEvent(event: RpcEvent<Target>): void | Promise<void>;

    async broadcast<
        D extends keyof P & string,
        E extends keyof P[D] & string,
    >({ domain, event, data, target }: RpcBroadcast<P, D, E, Target>) {
        const rpcEvent: RpcEvent<Target> = {
            domain,
            event,
            data,
        };
        if (target !== undefined) {
            rpcEvent.target = target;
        }
        await this.produceEvent(rpcEvent);
    }

}
