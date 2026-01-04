import { HttpContext } from '@luminable/http-server';
import { dep } from 'mesh-ioc';

import { Get, Middleware } from '../../main/index.js';

export class BaseRouter {

    @dep() protected ctx!: HttpContext;

    @Middleware({ summary: 'Base middleware' })
    async baseMiddleware() {
        this.ctx.addResponseHeader('x-middleware', 'base');
    }

    @Get({ path: '/base' })
    async getBase() {
        return {
            base: 123
        };
    }

}
