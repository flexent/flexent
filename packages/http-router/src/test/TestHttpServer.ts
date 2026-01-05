import { HttpContext, HttpHandler, HttpNext, HttpServer } from '@luminable/http-server';
import { dep, Mesh } from 'mesh-ioc';

export class TestHttpServer extends HttpServer {

    @dep() private mesh!: Mesh;
    @dep({ key: 'Handler' }) private handler!: HttpHandler;

    async handle(ctx: HttpContext, next: HttpNext) {
        this.mesh.constant(HttpContext, ctx);
        await this.handler.handle(ctx, next);
    }

}
