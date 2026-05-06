import { ProtocolEventEmitter } from '@flexent/protocomm';

import { FakeWs } from './FakeWs.js';
import { protocol, type TestProtocol } from './TestProtocol.js';
import { TestWsProtocolHandler } from './TestWsProtocolHandler.js';

export class TestRuntime {

    events: ProtocolEventEmitter<TestProtocol, string> | null = null;
    handler: TestWsProtocolHandler | null = null;
    ws: FakeWs | null = null;

    setup(): void {
        this.ws = new FakeWs();
        this.events = new ProtocolEventEmitter<TestProtocol, string>(protocol);
        this.handler = new TestWsProtocolHandler(this.events);
        Object.defineProperty(this.handler, 'ws', {
            value: this.ws,
        });
        Object.defineProperty(this.handler, 'logger', {
            value: {
                debug() {},
                error() {},
            },
        });
        this.handler.init();
    }

    afterEach(): void {
        this.events = null;
        this.handler = null;
        this.ws = null;
    }

}

export const runtime = new TestRuntime();
