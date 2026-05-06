import { type RpcEvent } from '@flexent/protocomm';
import { type Event } from 'nanoevent';

import { WsProtocolHandler } from '../main/WsProtocolHandler.js';
import { protocol, type TestProtocol } from './TestProtocol.js';
import { protocolImpl } from './TestProtocolImpl.js';

export class TestWsProtocolHandler extends WsProtocolHandler<TestProtocol, string> {

    constructor(
        readonly eventBus: Event<RpcEvent<string>>,
    ) {
        super();
    }

    get protocol() {
        return protocol;
    }

    get protocolImpl() {
        return protocolImpl;
    }

    protected override acceptsEvent(event: { target?: string }): boolean {
        return !event.target || event.target === 'client:one';
    }

}
