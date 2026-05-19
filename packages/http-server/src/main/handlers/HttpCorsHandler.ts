import { AccessDeniedError } from '@flexent/errors';
import { HttpContext, HttpHandler, HttpNext } from '@flexent/http-server';
import { config } from 'mesh-config';

/**
 * Sets Access-Control-* headers and responds to CORS preflight requests.
 *
 * Note: it should be bound to global scope because doesn't use request-scoped dependencies.
 */
export class HttpCorsHandler implements HttpHandler {

    @config({ default: 'Content-Length,Date' })
    CORS_EXPOSE_HEADERS!: string;

    @config({ default: 3600 })
    CORS_MAX_AGE!: number;

    @config({ default: true })
    CORS_ALLOW_CREDENTIALS!: boolean;

    @config({ default: '*' })
    CORS_ALLOWED_ORIGINS!: string;

    private get allowedOrigins(): string[] {
        return this.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
    }

    async handle(ctx: HttpContext, next: HttpNext) {
        ctx.setResponseHeader('Vary', 'Origin');
        const origin = ctx.state.corsOrigin ?? ctx.getRequestHeader('Origin');
        if (!origin) {
            return next();
        }
        if (!this.allowedOrigins.includes('*')) {
            if (!this.allowedOrigins.includes(origin)) {
                throw new AccessDeniedError('Origin not allowed');
            }
        }
        const maxAge = ctx.state.corsMaxAge ?? this.CORS_MAX_AGE;
        const exposeHeaders = ctx.state.corsExposeHeaders ?? this.CORS_EXPOSE_HEADERS;
        const allowCredentials = ctx.state.corsAllowCredentials ?? this.CORS_ALLOW_CREDENTIALS;
        ctx.setResponseHeader('Access-Control-Allow-Origin', origin);
        ctx.setResponseHeader('Access-Control-Max-Age', String(maxAge));
        ctx.setResponseHeader('Access-Control-Expose-Headers', exposeHeaders);
        ctx.setResponseHeader('Access-Control-Allow-Credentials', String(allowCredentials));
        // Respond with 204 to preflight request
        const isPreflight = ctx.method === 'OPTIONS' && !!ctx.getRequestHeader('Access-Control-Request-Method');
        if (isPreflight) {
            const allowedMethods = ctx.state.corsAllowedMethods ?? ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
            const allowedHeaders = ctx.getRequestHeader('Access-Control-Request-Headers');
            ctx.setResponseHeader('Access-Control-Allow-Methods', allowedMethods.join(','));
            ctx.setResponseHeader('Access-Control-Allow-Headers', allowedHeaders);
            ctx.status = 204;
            return;
        }
        return next();
    }

}
