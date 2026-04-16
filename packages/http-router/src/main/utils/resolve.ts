import { type Constructor, type Mesh } from 'mesh-ioc';

import { getAllRoutes } from '../decorators/route.js';
import { type RouteDefinition } from '../types.js';

export interface RouterBinding {
    bindingKey: string;
    routerClass: Constructor<any>;
    routes: RouteDefinition[];
}

export function resolveRouterBindings(mesh: Mesh): RouterBinding[] {
    const result: RouterBinding[] = [];
    for (const [key, binding] of mesh.allBindings()) {
        if (binding.type !== 'service') {
            continue;
        }
        const allRoutes = getAllRoutes(binding.class);
        if (allRoutes.length > 0) {
            result.push({
                bindingKey: key,
                routerClass: binding.class,
                routes: allRoutes,
            });
        }
    }
    return result;
}
