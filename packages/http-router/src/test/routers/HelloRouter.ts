import { type HttpContext } from '@flexent/http-server';
import { dep } from 'mesh-ioc';

import { BodyParam, Get, Middleware, Post, QueryParam } from '../../main/index.js';

export class HelloRouter {

    @dep() private ctx!: HttpContext;

    @Middleware({ summary: 'Hello one' })
    async middlewareOne() {
        this.ctx.addResponseHeader('x-middleware', 'one');
    }

    @Middleware({ summary: 'Hello two' })
    async middlewareTwo() {
        this.ctx.addResponseHeader('x-middleware', 'two');
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
            schema: { type: 'number' },
        })
        age: number,
    ) {
        return {
            name,
            age,
        };
    }

}
