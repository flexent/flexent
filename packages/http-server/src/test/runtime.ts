import { Logger } from '@luminable/logger';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh, ServiceConstructor } from 'mesh-ioc';

import { HttpHandler, HttpServer } from '../main/index.js';
import { BarMiddleware, CatchMiddleware, EndpointHandler, FooMiddleware, ThrowMiddleware } from './handlers.js';
import { TestLogger } from './TestLogger.js';

export class TestRuntime {

    @dep({ cache: false }) httpServer!: HttpServer;
    @dep({ cache: false }) logger!: Logger;
    @dep({ cache: false }) config!: Config;

    mesh = new Mesh();
    requestScope = new Mesh();
    events: string[] = [];

    async setup() {
        process.loadEnvFile('.env.test');
        this.events = [];
        this.mesh = new Mesh('App');
        this.mesh.connect(this);
        this.mesh.service(TestLogger);
        this.mesh.alias(Logger, TestLogger);
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(HttpServer);
        this.mesh.scope('HttpScope', () => this.requestScope);
        this.requestScope = new Mesh('Request', this.mesh);
        this.requestScope.service(FooMiddleware);
        this.requestScope.service(BarMiddleware);
        this.requestScope.service(CatchMiddleware);
        this.requestScope.service(ThrowMiddleware);
        this.requestScope.service(EndpointHandler);
    }

    async afterEach() {
        await this.httpServer.stop();
    }

    get port() {
        return this.httpServer.HTTP_PORT;
    }

    getUrl(path = '/') {
        return `http://127.0.0.1:${this.port}${path}`;
    }

    setHandler(handler: ServiceConstructor<HttpHandler>) {
        this.requestScope.service(HttpHandler, handler);
    }

}

export const runtime = new TestRuntime();
