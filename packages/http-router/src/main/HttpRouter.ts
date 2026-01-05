import { HttpContext, HttpHandler, HttpNext } from '@luminable/http-server';
import { Constructor } from 'mesh-ioc';

import { getAllRoutes } from './decorators/route.js';
import { handleRouter } from './utils/handle.js';

/**
 * A base class for HTTP routers.
 *
 * When inherited by a class with route decorators,
 * the class becomes an HTTP handler that handles
 * routes defined in the class.
 *
 * This is useful when a standalone HTTP handler is desired,
 * e.g. when the order of handlers is important.
 *
 * In most cases, AppRouterHandler should be used to match and handle
 * all routers defined in a mesh.
 *
 * Chain-friendly: if nothing matches, next() is called to allow other handlers to execute.
 */
export class HttpRouter implements HttpHandler {

    async handle(ctx: HttpContext, next: HttpNext) {
        const routes = getAllRoutes(this.constructor as Constructor<any>);
        const handled = await handleRouter(this, routes, ctx);
        if (handled) {
            return;
        }
        return await next();
    }

}
