import 'reflect-metadata';

import { RouteMetrics } from '@luminable/http-router';
import { HttpCorsHandler, HttpErrorHandler, HttpHandler, HttpServer } from '@luminable/http-server';
import { Logger } from '@luminable/logger';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { MetaHandler } from './MetaHandler.js';
import { MetaHttpServer } from './MetaHttpServer.js';
import { MetaRouter } from './MetaRouter.js';
import { ProcessMetrics } from './ProcessMetrics.js';
import { ProcessSignals } from './ProcessSignals.js';
import { StandardLogger } from './StandardLogger.js';
import { assertMissingDeps } from './utils/deps.js';
import { configureEnv, getEnvName } from './utils/env.js';

const process = global.process;

/**
 * Common application setup with Mesh IoC, logger, metrics and start/stop hooks.
 */
export abstract class BaseApp {

    @dep() logger!: Logger;
    @dep() processEnvConfig!: ProcessEnvConfig;
    @dep() httpServer!: HttpServer;
    @dep() metaHttpServer!: MetaHttpServer;
    @dep() processSignals!: ProcessSignals;

    mesh: Mesh;

    constructor() {
        this.mesh = new Mesh();
        this.mesh.connect(this);
        this.mesh.service(ProcessEnvConfig);
        this.mesh.alias(Config, ProcessEnvConfig);
        this.mesh.service(StandardLogger);
        this.mesh.alias(Logger, StandardLogger);
        this.mesh.service(ProcessSignals);
        this.mesh.service(RouteMetrics);
        this.mesh.service(ProcessMetrics);
        this.mesh.service(HttpServer);
        this.mesh.service(MetaHttpServer);
        // Global Handlers
        this.mesh.service(HttpCorsHandler);
        this.mesh.service(HttpErrorHandler);
        // Scopes
        this.mesh.scope('HttpScope', () => this.createHttpScope());
        this.mesh.scope('MetaScope', () => this.createMetaScope());
    }

    createHttpScope() {
        const scope = new Mesh('Http', this.mesh);
        return scope;
    }

    createMetaScope() {
        const scope = new Mesh('Meta', this.mesh);
        this.mesh.service(MetaRouter);
        this.mesh.service(HttpHandler, MetaHandler);
        return scope;
    }

    /**
     * Application initialization code.
     * Called on production startup and during tests.
     */
    async start() {
        const env = getEnvName();
        configureEnv(env);
        this.processEnvConfig.refresh();
        this.logger.info('Starting application', { env });
        assertMissingDeps(this.mesh);
    }

    /**
     * Application shutdown code.
     * Called when production app gracefully terminates and during tests.
     */
    async stop() {
        this.logger.info('Stopping application');
    }

    /**
     * The method called by application entrypoint.
     * Tests do not use that.
     */
    async run() {
        try {
            this.processSignals.installSignalHandlers();
            this.processSignals.onStopRequested.on(() => this.shutdown(), this);
            await this.start();
        } catch (error) {
            this.logger.error(`Failed to start ${this.constructor.name}`, { error });
            process.exit(1);
        }
    }

    /**
     * Called on SIGTERM/SIGINT, when the app is running using `run()`.
     * Tests do not use that.
     */
    async shutdown() {
        try {
            this.processSignals.uninstallSignalHandlers();
            this.processSignals.onStopRequested.removeAll(this);
            await this.stop();
            process.exit(0);
        } catch (error) {
            this.logger.error(`Failed to stop ${this.constructor.name}`, { error });
            process.exit(1);
        }
    }

}
