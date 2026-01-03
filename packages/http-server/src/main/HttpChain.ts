import { HttpContext } from './HttpContext.js';
import { HttpHandler, HttpNext } from './HttpHandler.js';
import { composeHandlers } from './util.js';

export class HttpChain implements HttpHandler {

    handlers: HttpHandler[];

    constructor(handlers: HttpHandler[] = []) {
        this.handlers = handlers;
    }

    async handle(ctx: HttpContext, next: HttpNext) {
        return await composeHandlers(this.handlers).handle(ctx, next);
    }

}
