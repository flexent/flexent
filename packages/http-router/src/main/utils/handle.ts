import { HttpContext } from '@luminable/http-server';

import { ParamDefinition, RouteDefinition } from '../types.js';
import { matchEndpoint, matchRoute } from './match.js';

export async function handleRouter(
    instance: any,
    routes: RouteDefinition[],
    ctx: HttpContext
): Promise<RouteDefinition | null> {
    const endpoint = matchEndpoint(routes, ctx.method, ctx.path);
    if (!endpoint) {
        return null;
    }
    const middlewares = routes.filter(r => r.role === 'middleware');
    const routesToExecute = [...middlewares, endpoint];
    for (const route of routesToExecute) {
        await handleSingleRoute(instance, route, ctx);
    }
    return endpoint;
}

export async function handleSingleRoute(
    instance: any,
    route: RouteDefinition,
    ctx: HttpContext
): Promise<boolean> {
    const match = matchRoute(route, ctx.method, ctx.path);
    if (!match) {
        return false;
    }
    Object.assign(ctx.params, match);
    const fn = instance[route.memberKey];
    const params = await assembleRouteParams(route, ctx);
    const outcome = await fn.apply(instance, params);
    if (route.role === 'endpoint') {
        ctx.responseBody = outcome;
    }
    return true;
}

export async function assembleRouteParams(route: RouteDefinition, ctx: HttpContext) {
    const result: any[] = [];
    for (const param of route.params) {
        switch (param.source) {
            case 'path': {
                const value = ctx.params[param.name];
                result.push(convertParamValue(param, value, true));
                break;
            }
            case 'query': {
                const value = ctx.query[param.name];
                result.push(convertParamValue(param, value, true));
                break;
            }
            case 'header': {
                const value = ctx.getRequestHeader(param.name);
                result.push(convertParamValue(param, value, true));
                break;
            }
            case 'body': {
                const bodyType = ctx.inferRequestBodyType();
                const body = await ctx.readRequestBody(bodyType) ?? {};
                const coerce = bodyType !== 'json';
                result.push(convertParamValue(param, body[param.name], coerce));
                break;
            }
            case 'bodyJson': {
                const body = await ctx.readRequestBody() ?? {};
                result.push(convertParamValue(param, body, false));
                break;
            }
        }
    }
    return result;
}

export function convertParamValue(param: ParamDefinition, value: any, coerceString: boolean) {
    if (coerceString) {
        // Only attempt JSON parse if the target type is not string
        if (param.schema.schema.type !== 'string') {
            try {
                const json = JSON.parse(value);
                return param.schema.decode(json, { strictRequired: true });
            } catch (_err) {};
        }
    }
    return param.schema.decode(value, { strictRequired: true });
}
