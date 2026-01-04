import 'reflect-metadata';

import { InitializationError } from '@luminable/errors';
import { parsePath } from '@luminable/pathmatcher';
import { Schema } from 'airtight';
import { Constructor } from 'mesh-ioc';
import { addClassMetadata, getClassMetadata } from 'reflect-utils';

import { getParamDefinitions } from './param.js';
import { RouteDefinition, RouteMethod, RouteRole, RouteSpec } from './types.js';

const ROUTES_KEY = Symbol.for('@luminable/http/routes');

export function Get(spec: RouteSpec = {}) {
    return createRouteDecorator('GET', 'endpoint', spec);
}

export function Post(spec: RouteSpec = {}) {
    return createRouteDecorator('POST', 'endpoint', spec);
}

export function Put(spec: RouteSpec = {}) {
    return createRouteDecorator('PUT', 'endpoint', spec);
}

export function Delete(spec: RouteSpec = {}) {
    return createRouteDecorator('DELETE', 'endpoint', spec);
}

export function Patch(spec: RouteSpec = {}) {
    return createRouteDecorator('PATCH', 'endpoint', spec);
}

export function Any(spec: RouteSpec = {}) {
    return createRouteDecorator('*', 'endpoint', spec);
}

export function Middleware(spec: RouteSpec = {}) {
    return createRouteDecorator('*', 'middleware', spec);
}

export function getAllRoutes(routerClass: Constructor<any>): RouteDefinition[] {
    return getClassMetadata(ROUTES_KEY, routerClass.prototype) ?? [];
}

export function getEndpointRoutes(routerClass: Constructor<any>): RouteDefinition[] {
    return getAllRoutes(routerClass).filter(r => r.role === 'endpoint');
}

export function getMiddlewareRoutes(routerClass: Constructor<any>): RouteDefinition[] {
    return getAllRoutes(routerClass).filter(r => r.role === 'middleware');
}

function createRouteDecorator(method: RouteMethod, role: RouteRole, spec: RouteSpec) {
    return (target: any, methodKey: string) => {
        const params = getParamDefinitions(target, methodKey);
        const bodyParams = params.filter(p => p.source === 'body');
        if (spec.requestBodySchema && bodyParams.length > 0) {
            throw new InitializationError(`${method} ${spec.path}: cannot use both BodyParam and requestBodySchema`);
        }
        const path = spec.path ?? '*';
        const pathTokens = parsePath(path);
        const requestBodySchema = spec.requestBodySchema ?
            new Schema(spec.requestBodySchema) :
            undefined;
        const routeDef: RouteDefinition = {
            role,
            method,
            path,
            summary: spec.summary ?? '',
            deprecated: spec.deprecated ?? false,
            pathTokens,
            params,
            requestBodySchema,
            responses: spec.responses ?? {},
        };
        addClassMetadata(ROUTES_KEY, target, routeDef);
    };
}
