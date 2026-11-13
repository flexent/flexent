import { HttpContext } from '@flexent/http-server';
import { matchPath } from '@flexent/pathmatcher';
import { Constructor } from 'mesh-ioc';

import { getAllRoutes } from './decorators/route.js';
import { ParamDefinition, RouteDefinition } from './types.js';

/**
 * The routes a router class declares: matches requests against them
 * and runs the matching middlewares and endpoint on a router instance.
 */
export class RouteTable {

    private routes: RouteDefinition[];

    constructor(routerClass: Constructor<any>) {
        this.routes = getAllRoutes(routerClass);
    }

    get isEmpty() {
        return this.routes.length === 0;
    }

    /**
     * Returns the first endpoint that matches the method and path exactly, or `null`.
     */
    matchEndpoint(method: string, path: string): RouteDefinition | null {
        for (const route of this.routes) {
            if (route.role === 'endpoint' && this.matchRoute(route, method, path)) {
                return route;
            }
        }
        return null;
    }

    /**
     * Runs the matching middlewares, then the matching endpoint, on the router instance.
     * Returns the endpoint, or `null` when no endpoint matches (then nothing runs).
     */
    async handleRequest(router: any, ctx: HttpContext): Promise<RouteDefinition | null> {
        const endpoint = this.matchEndpoint(ctx.method, ctx.path);
        if (!endpoint) {
            return null;
        }
        const middlewares = this.routes.filter(route => route.role === 'middleware');
        for (const route of [...middlewares, endpoint]) {
            await this.runRoute(router, route, ctx);
        }
        return endpoint;
    }

    private matchRoute(route: RouteDefinition, method: string, path: string) {
        const methodMatch = route.method === '*' || route.method.toLowerCase() === method.toLowerCase();
        if (!methodMatch) {
            return null;
        }
        return matchPath(route.path, path, route.role !== 'endpoint');
    }

    private async runRoute(router: any, route: RouteDefinition, ctx: HttpContext) {
        const match = this.matchRoute(route, ctx.method, ctx.path);
        if (!match) {
            return;
        }
        Object.assign(ctx.params, match);
        const params = await this.assembleParams(route, ctx);
        const outcome = await router[route.memberKey](...params);
        if (route.role === 'endpoint' && outcome !== undefined) {
            ctx.responseBody = outcome;
        }
    }

    private async assembleParams(route: RouteDefinition, ctx: HttpContext) {
        const result: any[] = [];
        for (const param of route.params) {
            result.push(await this.readParam(param, ctx));
        }
        return [...result, ctx];
    }

    private async readParam(param: ParamDefinition, ctx: HttpContext) {
        switch (param.source) {
            case 'path':
                return this.convertParam(param, ctx.params[param.name], true);
            case 'query':
                return this.convertParam(param, ctx.query[param.name], true);
            case 'header':
                return this.convertParam(param, ctx.getRequestHeader(param.name), true);
            case 'body': {
                const bodyType = ctx.inferRequestBodyType();
                const body = await ctx.readRequestBody(bodyType) ?? {};
                return this.convertParam(param, body[param.name], bodyType !== 'json');
            }
            case 'bodyJson': {
                const body = await ctx.readRequestBody() ?? {};
                return this.convertParam(param, body, false);
            }
        }
    }

    private convertParam(param: ParamDefinition, value: any, coerceString: boolean) {
        // Strings arrive as text: try them as JSON first, unless the target type is a string
        if (coerceString && param.schema.schema.type !== 'string') {
            try {
                return param.schema.decode(JSON.parse(value), { strictRequired: true });
            } catch {}
        }
        return param.schema.decode(value, { strictRequired: true });
    }

}
