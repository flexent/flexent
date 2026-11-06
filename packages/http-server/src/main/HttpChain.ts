import { createChain } from './helpers/http.js';
import { HttpContext } from './HttpContext.js';
import { HttpHandler } from './HttpHandler.js';
import { HttpNext } from './types.js';

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
