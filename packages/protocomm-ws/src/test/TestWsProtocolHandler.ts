import { type ProtocolEventEmitter } from '@flexent/protocomm';

import { WsProtocolHandler } from '../main/WsProtocolHandler.js';
import { protocol, type TestProtocol } from './TestProtocol.js';
import { protocolImpl } from './TestProtocolImpl.js';

export class TestWsProtocolHandler extends WsProtocolHandler<TestProtocol, string> {

    constructor(
        readonly events: ProtocolEventEmitter<TestProtocol, string>,
    ) {
        super();
    }

    get protocol() {
        return protocol;
    }

    get protocolImpl() {
        return protocolImpl;
    }

    protected override get eventSource() {
        return this.events;
    }

    protected override acceptsEvent(message: { target?: string }): boolean {
        return !message.target || message.target === 'client:one';
    }

}
