import { Get, Middleware } from '../../main/index.js';
import { BaseRouter } from './BaseRouter.js';

export class InheritedRouter extends BaseRouter {

    @Middleware({ summary: 'Inherited middleware' })
    async inheritedMiddleware() {
        this.ctx.addResponseHeader('x-middleware', 'inherited');
    }

    @Get({ path: '/inherited' })
    async getInherited() {
        return {
            inherited: 123
        };
    }

}
