import { HttpProtocolHandler } from '../main/HttpProtocolHandler.js';
import { protocol, type TestProtocol } from './TestProtocol.js';
import { protocolImpl } from './TestProtocolImpl.js';

export class TestHttpProtocolHandler extends HttpProtocolHandler<TestProtocol> {

    get protocol() {
        return protocol;
    }

    get protocolImpl() {
        return protocolImpl;
    }

}
