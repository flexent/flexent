import { type HttpContext } from './HttpContext.js';
import { HttpHandler } from './HttpHandler.js';
import { type HttpNext } from './types.js';
import { createChain } from './util.js';

export abstract class HttpChain extends HttpHandler {

    abstract handlers: HttpHandler[];

    protected composed: HttpHandler | null = null;

    async handle(ctx: HttpContext, next: HttpNext) {
        if (!this.composed) {
            this.composed = createChain(this.handlers);
        }
        return await this.composed.handle(ctx, next);
    }

}
