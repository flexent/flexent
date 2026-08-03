import { BaseProxy } from './BaseProxy.js';
import { ProxyUpstream } from './types.js';

/**
 * Proxy with dynamically configurable routing based on hostnames.
 *
 * Routes are matched against the destination hostname. First match wins.
 * Routes can optionally be labelled and removed by label.
 */
export class RoutingProxy extends BaseProxy {

    protected routes: ProxyRoute[] = [];

    getRoutes() {
        return this.routes;
    }

    override matchRoute(host: string): ProxyUpstream | null {
        for (const route of this.routes) {
            if (new RegExp(route.hostPattern, 'gi').test(host)) {
                return route.upstream;
            }
        }
        return this.defaultUpstream;
    }

    /**
     * Clears routing table. All requests will be routed directly.
     */
    clearRoutes() {
        this.routes = [];
    }

    /**
     * Inserts a new route. Requests matching `hostPattern` are routed to `upstream`.
     * Inserted at the beginning by default; first match wins.
     */
    insertRoute(route: ProxyInsertRouteSpec, index = 0) {
        this.routes.splice(index, 0, {
            label: 'default',
            ...route,
        });
    }

    /**
     * Removes routes matching the specified label.
     */
    removeRoutes(label: string) {
        this.routes = this.routes.filter(r => r.label !== label);
    }

}

export interface ProxyRoute {
    label: string;
    hostPattern: string;
    upstream: ProxyUpstream | null;
}

export interface ProxyInsertRouteSpec {
    label?: string;
    hostPattern: string;
    upstream: ProxyUpstream | null;
}
