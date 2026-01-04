import { Logger } from '@luminable/logger';
import dotenv from 'dotenv';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { AppRouterHandler } from '../main/AppRouterHandler.js';
import { HelloRouter } from './routers/HelloRouter.js';
import { InheritedRouter } from './routers/InheritedRouter.js';
import { ParamsRouter } from './routers/ParamsRouter.js';
import { TestHttpServer } from './TestHttpServer.js';
import { TestLogger } from './TestLogger.js';

export class TestRuntime {

    mesh = new Mesh();

    @dep({ cache: false }) httpServer!: TestHttpServer;

    async setup() {
        dotenv.config({ path: '.env.test', quiet: true });
        this.mesh = new Mesh('Test');
        this.mesh.connect(this);
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(TestLogger);
        this.mesh.alias(Logger, TestLogger);
        this.mesh.service(AppRouterHandler);
        this.mesh.service(TestHttpServer);
        this.mesh.service(HelloRouter);
        this.mesh.service(InheritedRouter);
        this.mesh.service(ParamsRouter);
    }

    get port() {
        return this.httpServer.HTTP_PORT;
    }

    getUrl(path = '/') {
        return `http://127.0.0.1:${this.port}${path}`;
    }

}

export const runtime = new TestRuntime();
