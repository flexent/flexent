import 'reflect-metadata';

import { InitializationError } from '@luminable/errors';
import { Schema } from 'airtight';

import { ParamDefinition, ParamSource, ParamSpec } from './types.js';

const PARAMS_KEY = Symbol.for('@luminable/http/params');

export function getParamDefinitions(target: any, methodKey: string): ParamDefinition[] {
    return Reflect.getMetadata(PARAMS_KEY, target, methodKey) ?? [];
}

export function PathParam(name: string, spec: ParamSpec) {
    return createParamDecorator('path', name, spec);
}

export function QueryParam(name: string, spec: ParamSpec) {
    return createParamDecorator('query', name, spec);
}

export function BodyParam(name: string, spec: ParamSpec) {
    return createParamDecorator('body', name, spec);
}

function createParamDecorator(source: ParamSource, name: string, spec: ParamSpec) {
    return (target: any, methodKey: string, index: number) => {
        const params = getParamDefinitions(target, methodKey);
        const {
            description = '',
            schema,
            required = true,
            deprecated = false,
        } = spec;
        if (params.find(p => p.name === name)) {
            throw new InitializationError(`Duplicate parameter name: ${name}`);
        }
        params.push({
            index,
            source,
            name,
            description,
            schema: new Schema(schema ?? { type: 'any' }),
            required,
            deprecated,
        });
        Reflect.defineMetadata(PARAMS_KEY, params, target, methodKey);
    };
}
