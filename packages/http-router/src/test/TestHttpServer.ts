import { HttpContext, HttpNext, HttpServer } from '@luminable/http-server';
import { dep, Mesh } from 'mesh-ioc';

import { AppRouterHandler } from '../main/AppRouterHandler.js';

export class TestHttpServer extends HttpServer {

    @dep() private routerHandle!: AppRouterHandler;
    @dep() private mesh!: Mesh;

    async handle(ctx: HttpContext, next: HttpNext) {
        this.mesh.constant(HttpContext, ctx);
        await this.routerHandle.handle(ctx, next);
    }

}
