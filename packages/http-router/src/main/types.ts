import { type PathToken } from '@luminable/pathmatcher';
import { type Schema, type SchemaDef } from 'airtight';

export type RouteRole = 'endpoint' | 'middleware';
export type RouteMethod = '*' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ParamSource = 'path' | 'query' | 'header' | 'body' | 'bodyJson';

export interface RouteDefinition {
    memberKey: string;
    role: RouteRole;
    method: RouteMethod;
    path: string;
    summary: string;
    deprecated: boolean;
    pathTokens: PathToken[];
    params: ParamDefinition[];
    responses: Record<number, ResponseSpec>;
}

export interface RouteSpec {
    path?: string;
    summary?: string;
    deprecated?: boolean;
    requestBodySchema?: SchemaDef<any>;
    responses?: Record<number, ResponseSpec>;
}

export interface ParamDefinition {
    index: number;
    name: string;
    source: ParamSource;
    schema: Schema<any>;
    description: string;
    deprecated: boolean;
}

export interface ParamSpec {
    schema?: SchemaDef<any>;
    description?: string;
    deprecated?: boolean;
}

export interface ResponseSpec {
    description?: string;
    schema?: SchemaDef<any>;
    contentType?: string;
}
