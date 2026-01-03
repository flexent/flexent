import { HttpContext } from './HttpContext.js';
import { HttpHandler, HttpNext } from './HttpHandler.js';
import { composeHandlers } from './util.js';

export abstract class HttpChain implements HttpHandler {

    abstract handlers: HttpHandler[];

    protected composed: HttpHandler | null = null;

    async handle(ctx: HttpContext, next: HttpNext) {
        if (!this.composed) {
            this.composed = composeHandlers(this.handlers);
        }
        return await this.composed.handle(ctx, next);
    }

}
