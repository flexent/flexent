import { HttpContext, HttpHandler, HttpNext } from '@luminable/http-server';
import { dep, Mesh } from 'mesh-ioc';

import { handleRouter } from './utils/handle.js';
import { matchEndpoint } from './utils/match.js';
import { resolveRouterBindings } from './utils/resolve.js';

/**
 * Resolves and matches all routers in the same mesh where this handler is added.
 *
 * If an endpoint matches, executes all middlewares and the endpoint itself,
 * in the order they are defined in router class.
 * It never executes routes that are not part of the matching router class.
 *
 * If multiple endpoints match across different router classes,
 * only one of them will be executed, and which one is unknown.
 *
 * Chain-friendly: if nothing matches, next() is called to allow other handlers to execute.
 */
export class RouteHandler implements HttpHandler {

    @dep() private mesh!: Mesh;

    async handle(ctx: HttpContext, next: HttpNext) {
        const routerBindings = resolveRouterBindings(this.mesh);
        for (const router of routerBindings) {
            // Only instantiate matching routers
            const match = matchEndpoint(router.routes, ctx.method, ctx.path);
            if (!match) {
                continue;
            }
            const instance = this.mesh.resolve(router.bindingKey);
            const handled = await handleRouter(instance, router.routes, ctx);
            if (handled) {
                return;
            }
        }
        return await next();
    }

}
