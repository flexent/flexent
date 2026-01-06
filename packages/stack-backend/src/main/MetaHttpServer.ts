import { createChain, HttpContext, HttpErrorHandler, HttpMetricsHandler, HttpNext, HttpServer, HttpStatusHandler } from '@luminable/http-server';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

/**
 * Serves application metadata over HTTP.
 *
 * Most settings inherit main HTTP configuration except:
 *
 * - port is configured with META_HTTP_PORT
 *   (it's a good practice to keep meta on a separate port and not expose it to the public)
 * - TLS is not used by default
 */
export class MetaHttpServer extends HttpServer {

    @config({ default: 8081 })
    META_HTTP_PORT!: number;

    @dep() protected errorHandler!: HttpErrorHandler;
    @dep() protected metricsHandler!: HttpMetricsHandler;
    @dep() protected statusHandler!: HttpStatusHandler;

    constructor() {
        super();
        this.config.port = this.META_HTTP_PORT;
        this.config.shutdownDelay = 0;
        this.config.tlsCert = '';
        this.config.tlsKey = '';
        this.config.tlsCa = '';
        this.config.tlsCiphers = '';
    }

    protected handler = createChain([
        this.errorHandler,
        this.metricsHandler,
        this.statusHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext) {
        return await this.handler.handle(ctx, next);
    }

}
