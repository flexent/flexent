import { HttpContext, HttpHandler, HttpNext } from '@flexent/http-server';
import { dep, Mesh } from 'mesh-ioc';

import { RouteMetrics } from './RouteMetrics.js';
import { RouteTable } from './RouteTable.js';

interface RouterBinding {
    bindingKey: string;
    routeTable: RouteTable;
}

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
export class HttpRouteHandler implements HttpHandler {

    @dep() private mesh!: Mesh;
    @dep({ optional: true }) private routeMetrics!: RouteMetrics;

    async handle(ctx: HttpContext, next: HttpNext) {
        for (const { bindingKey, routeTable } of this.listRouterBindings()) {
            // Only instantiate matching routers
            if (!routeTable.matchEndpoint(ctx.method, ctx.path)) {
                continue;
            }
            const startedAt = Date.now();
            const router = this.mesh.resolve(bindingKey);
            const handled = await routeTable.handleRequest(router, ctx);
            if (handled) {
                this.routeMetrics?.logLatency(handled, startedAt);
                return;
            }
        }
        return await next();
    }

    private listRouterBindings() {
        const bindings: RouterBinding[] = [];
        for (const [bindingKey, binding] of this.mesh.allBindings()) {
            if (binding.type !== 'service') {
                continue;
            }
            const routeTable = new RouteTable(binding.class);
            if (!routeTable.isEmpty) {
                bindings.push({
                    bindingKey,
                    routeTable,
                });
            }
        }
        return bindings;
    }

}
