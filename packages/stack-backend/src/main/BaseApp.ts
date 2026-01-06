import 'reflect-metadata';

import { InitializationError } from '@luminable/errors';
import { RouteMetrics } from '@luminable/http-router';
import { HttpCorsHandler, HttpErrorHandler, HttpMetricsHandler, HttpStatusHandler } from '@luminable/http-server';
import { Logger } from '@luminable/logger';
import dotenv from 'dotenv';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { MetaHttpServer } from './MetaHttpServer.js';
import { ProcessMetrics } from './ProcessMetrics.js';
import { StandardLogger } from './StandardLogger.js';

const process = global.process;

export type EnvName = 'development' | 'test' | 'production';

/**
 * Common application setup with Mesh IoC, logger, metrics and start/stop hooks.
 */
export abstract class BaseApp {

    @dep() logger!: Logger;
    @dep() processEnvConfig!: ProcessEnvConfig;
    @dep() metaHttpServer!: MetaHttpServer;

    constructor(readonly mesh: Mesh) {
        this.mesh.connect(this);
        this.mesh.service(ProcessEnvConfig);
        this.mesh.alias(Config, ProcessEnvConfig);
        this.mesh.service(StandardLogger);
        this.mesh.alias(Logger, StandardLogger);
        this.mesh.service(RouteMetrics);
        this.mesh.service(ProcessMetrics);
        this.mesh.service(MetaHttpServer);
        // Global Handlers
        this.mesh.service(HttpCorsHandler);
        this.mesh.service(HttpErrorHandler);
        this.mesh.service(HttpMetricsHandler);
        this.mesh.service(HttpStatusHandler);
    }

    get envName(): EnvName {
        if (process.env.NODE_ENV === 'development') {
            return 'development';
        }
        if (process.env.NODE_ENV === 'test') {
            return 'test';
        }
        return 'production';
    }

    /**
     * Application initialization code.
     * Called on production startup and during tests.
     */
    async start() {
        this.logger.info('Starting application', { env: this.envName });
        dotenv.config({ path: '.env' });
        if (this.envName === 'development') {
            dotenv.config({ path: '.env.dev' });
        }
        if (this.envName === 'test') {
            dotenv.config({ path: '.env.test' });
            dotenv.config({ path: '.env.dev' });
        }
        this.processEnvConfig.refresh();
        this.assertMissingDeps();
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
            process.on('uncaughtException', error => {
                this.logger.error('uncaughtException', { error });
            });
            process.on('unhandledRejection', error => {
                this.logger.error('unhandledRejection', { error });
            });
            process.on('SIGTERM', async () => {
                this.logger.info('Received SIGTERM');
                await this.shutdown();
            });
            process.on('SIGINT', async () => {
                this.logger.info('Received SIGINT');
                await this.shutdown();
            });
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
            process.removeAllListeners();
            await this.stop();
            process.exit(0);
        } catch (error) {
            this.logger.error(`Failed to stop ${this.constructor.name}`, { error });
            process.exit(1);
        }
    }

    assertMissingDeps() {
        const missingDepKeys = [...this.mesh.missingDeps()].map(_ => _.key);
        if (missingDepKeys.length > 0) {
            throw new InitializationError(`The following class dependencies are not found in application global scope: ${missingDepKeys}`);
        }
    }

}
