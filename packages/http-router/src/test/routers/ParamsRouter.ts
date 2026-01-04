import { BodyJson, BodyParam, Get, HeaderParam, PathParam, Post, QueryParam } from '../../main/index.js';

export class ParamsRouter {

    @Get({ path: '/params/path/{str}/{num}/{bool}' })
    async pathParams(
        @PathParam('str', { schema: { type: 'string' } }) str: string,
        @PathParam('num', { schema: { type: 'number' } }) num: number,
        @PathParam('bool', { schema: { type: 'boolean' } }) bool: boolean,
    ) {
        return { str, num, bool };
    }

    @Get({ path: '/params/query' })
    async queryParams(
        @QueryParam('str', { schema: { type: 'string' } }) str: string,
        @QueryParam('num', { schema: { type: 'number' } }) num: number,
        @QueryParam('bool', { schema: { type: 'boolean' } }) bool: boolean,
        @QueryParam('arr', {
            schema: { type: 'array', items: { type: 'string' } }
        }) arr: string[],
        @QueryParam('obj', {
            schema: {
                type: 'object',
                properties: {},
                additionalProperties: { type: 'any' }
            }
        }) obj: Record<string, any>,
    ) {
        return { str, num, bool, arr, obj };
    }

    @Get({ path: '/params/header' })
    async headerParams(
        @HeaderParam('x-str', { schema: { type: 'string' } }) str: string,
        @HeaderParam('x-num', { schema: { type: 'number' } }) num: number,
        @HeaderParam('x-bool', { schema: { type: 'boolean' } }) bool: boolean,
        @HeaderParam('x-arr', {
            schema: { type: 'array', items: { type: 'string' } }
        }) arr: string[],
        @HeaderParam('x-obj', {
            schema: {
                type: 'object',
                properties: {},
                additionalProperties: { type: 'any' }
            }
        }) obj: Record<string, any>,
    ) {
        return { str, num, bool, arr, obj };
    }

    @Post({ path: '/params/body' })
    async bodyParams(
        @BodyParam('str', {
            schema: { type: 'string' }
        }) str: string,
        @BodyParam('num', {
            schema: { type: 'number' }
        }) num: number,
        @BodyParam('bool', {
            schema: { type: 'boolean' }
        }) bool: boolean,
        @BodyParam('arr', {
            schema: { type: 'array', items: { type: 'string' } }
        }) arr: string[],
        @BodyParam('obj', {
            schema: {
                type: 'object',
                properties: {},
                additionalProperties: { type: 'any' }
            }
        }) obj: Record<string, any>,
    ) {
        return { str, num, bool, arr, obj };
    }

    @Post({ path: '/params/body/json' })
    async bodyJsonParams(
        @BodyJson({
            schema: {
                type: 'object',
                properties: {
                    str: { type: 'string' },
                    num: { type: 'number' },
                    bool: { type: 'boolean' },
                    arr: { type: 'array', items: { type: 'string' } },
                    obj: { type: 'object', properties: {}, additionalProperties: { type: 'any' } }
                }
            }
        }) body: unknown,
    ) {
        return body;
    }

}
