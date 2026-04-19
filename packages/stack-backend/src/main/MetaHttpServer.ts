import { HttpServer } from '@flexent/http-server';
import { config } from 'mesh-config';
import { scope, type ScopeProvider } from 'mesh-ioc';

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

    @scope('MetaScope')
    protected override createScope!: ScopeProvider;

    constructor() {
        super();
        this.config.port = this.META_HTTP_PORT;
        this.config.shutdownDelay = 0;
        this.config.tlsCert = '';
        this.config.tlsKey = '';
        this.config.tlsCa = '';
        this.config.tlsCiphers = '';
    }

}
