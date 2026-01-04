import { matchPath } from '@luminable/pathmatcher';

import { RouteDefinition } from '../types.js';

export function matchRoute(
    routeDef: RouteDefinition,
    method: string,
    path: string
) {
    const methodMatch = routeDef.method === '*' ||
        routeDef.method.toLowerCase() === method.toLowerCase();
    if (!methodMatch) {
        return null;
    }
    const matchExact = routeDef.role === 'endpoint';
    return matchPath(routeDef.path, path, !matchExact);
}

export function matchEndpoint(
    routeDefs: RouteDefinition[],
    method: string,
    path: string
) {
    const endpoints = routeDefs.filter(r => r.role === 'endpoint');
    for (const endpoint of endpoints) {
        const match = matchRoute(endpoint, method, path);
        if (match) {
            return endpoint;
        }
    }
    return null;
}
