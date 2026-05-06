import { TestHttpProtocolHandler } from './TestHttpProtocolHandler.js';

export class TestRuntime {

    handler: TestHttpProtocolHandler | null = null;

    setup(): void {
        this.handler = new TestHttpProtocolHandler();
        Object.defineProperty(this.handler, 'logger', {
            value: {
                debug() {},
            },
        });
    }

    afterEach(): void {
        this.handler = null;
    }

}

export const runtime = new TestRuntime();
