import { HttpHandler, HttpServer } from '@luminable/http-server';
import { Logger } from '@luminable/logger';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { RouteHandler } from '../main/RouteHandler.js';
import { HelloRouter } from './routers/HelloRouter.js';
import { InheritedRouter } from './routers/InheritedRouter.js';
import { ParamsRouter } from './routers/ParamsRouter.js';
import { TestLogger } from './TestLogger.js';

export class TestRuntime {

    mesh = new Mesh();

    @dep({ cache: false }) httpServer!: HttpServer;

    async setup() {
        process.loadEnvFile('.env.test');
        this.mesh = new Mesh('Test');
        this.mesh.connect(this);
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(TestLogger);
        this.mesh.alias(Logger, TestLogger);
        this.mesh.service(HttpServer);
        this.mesh.scope('HttpScope', () => this.createRequestScope());
    }

    createRequestScope(): Mesh {
        const mesh = new Mesh('Request', this.mesh);
        mesh.service(RouteHandler);
        mesh.service(HelloRouter);
        mesh.service(InheritedRouter);
        mesh.service(ParamsRouter);
        mesh.alias(HttpHandler, RouteHandler);
        return mesh;
    }

    get port() {
        return this.httpServer.HTTP_PORT;
    }

    getUrl(path = '/') {
        return `http://127.0.0.1:${this.port}${path}`;
    }

}

export const runtime = new TestRuntime();
