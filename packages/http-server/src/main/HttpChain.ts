import { HttpContext } from './HttpContext.js';
import { HttpHandler, HttpNext } from './HttpHandler.js';
import { createChain } from './util.js';

export abstract class HttpChain implements HttpHandler {

    abstract handlers: HttpHandler[];

    protected composed: HttpHandler | null = null;

    async handle(ctx: HttpContext, next: HttpNext) {
        if (!this.composed) {
            this.composed = createChain(this.handlers);
        }
        return await this.composed.handle(ctx, next);
    }

}
