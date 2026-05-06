import { type RpcEvent } from '@flexent/protocomm';
import { Event } from 'nanoevent';

import { FakeWs } from './FakeWs.js';
import { TestWsProtocolHandler } from './TestWsProtocolHandler.js';

export class TestRuntime {

    eventBus: Event<RpcEvent<string>> | null = null;
    handler: TestWsProtocolHandler | null = null;
    ws: FakeWs | null = null;

    setup(): void {
        this.ws = new FakeWs();
        this.eventBus = new Event<RpcEvent<string>>();
        this.handler = new TestWsProtocolHandler(this.eventBus);
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
        this.eventBus = null;
        this.handler = null;
        this.ws = null;
    }

}

export const runtime = new TestRuntime();
