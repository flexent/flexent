import { HttpContext } from '@luminable/http-server';
import { dep } from 'mesh-ioc';

import { BodyParam, Get, Middleware, Post, QueryParam } from '../../main/index.js';

export class HelloRouter {

    @dep() private ctx!: HttpContext;

    @Middleware({ summary: 'Hello middleware' })
    async fooMiddleware() {
        this.ctx.addResponseHeader('x-middleware', 'hello');
    }

    @Get({ path: '/hello' })
    async getHello() {
        return {
            hello: 'World'
        };
    }

    @Post({ path: '/hello' })
    async createHello(
        @BodyParam('name', {
            schema: { type: 'string' },
        })
        name: string,
        @QueryParam('age', {
            required: false,
            schema: { type: 'number' },
        })
        age?: number,
    ) {
        return {
            hello: name,
            age,
        };
    }

}
