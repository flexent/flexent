import { type ProtocolEventData, type RpcEvent } from './types.js';

export abstract class RpcEventProducer<P, Target = unknown> {

    abstract produceEvent(event: RpcEvent<Target>): void | Promise<void>;

    async broadcast<
        D extends keyof P & string,
        E extends keyof P[D] & string,
    >(domain: D, event: E, data: ProtocolEventData<P, D, E>, target?: Target) {
        const rpcEvent: RpcEvent<Target> = { domain, event, data };
        if (target !== undefined) {
            rpcEvent.target = target;
        }
        await this.produceEvent(rpcEvent);
    }

}
