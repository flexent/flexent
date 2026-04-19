import { NotFoundError } from '@flexent/errors';
import { type Logger } from '@flexent/logger';
import * as http from 'http';
import * as https from 'https';
import { config } from 'mesh-config';
import { dep, type Mesh, scope, type ScopeProvider } from 'mesh-ioc';
import { type Socket } from 'net';

import { HttpContext } from './HttpContext.js';
import { HttpHandler } from './HttpHandler.js';
import { type HttpNext } from './types.js';

export interface HttpServerConfig {
    port: number;
    address: string;
    socketTimeout: number;
    shutdownDelay: number;
    requestBodyLimitBytes: number;
    tlsCert?: string;
    tlsKey?: string;
    tlsCa?: string;
    tlsCiphers?: string;
}

export class HttpServer {

    @config({ default: 8080 }) HTTP_PORT!: number;
    @config({ default: '' }) HTTP_ADDRESS!: string;
    @config({ default: 120_000 }) HTTP_TIMEOUT!: number;
    @config({ default: 30_000 }) HTTP_SHUTDOWN_DELAY!: number;
    @config({ default: 5 * 1024 * 1024 }) HTTP_REQUEST_BODY_LIMIT_BYTES!: number;

    @config({ default: '' }) HTTP_TLS_CERT!: string;
    @config({ default: '' }) HTTP_TLS_KEY!: string;
    @config({ default: '' }) HTTP_TLS_CA!: string;
    @config({ default: '' }) HTTP_TLS_CIPHERS!: string;

    @dep() protected logger!: Logger;
    @dep() protected mesh!: Mesh;

    @scope('HttpScope') protected createScope!: ScopeProvider;

    protected config: HttpServerConfig;
    protected server: http.Server | https.Server | null = null;
    protected requestsPerSocket = new Map<Socket, number>();
    protected stopping = false;

    constructor() {
        this.config = {
            port: this.HTTP_PORT,
            address: this.HTTP_ADDRESS,
            socketTimeout: this.HTTP_TIMEOUT,
            shutdownDelay: this.HTTP_SHUTDOWN_DELAY,
            requestBodyLimitBytes: this.HTTP_REQUEST_BODY_LIMIT_BYTES,
            tlsCert: this.HTTP_TLS_CERT || undefined,
            tlsKey: this.HTTP_TLS_KEY || undefined,
            tlsCa: this.HTTP_TLS_CA || undefined,
            tlsCiphers: this.HTTP_TLS_CIPHERS || undefined,
        };
    }

    async start() {
        if (this.server) {
            return;
        }
        this.stopping = false;
        this.requestsPerSocket.clear();
        const server = this.createServer();
        this.server = server;
        server.on('connection', sock => this.onConnection(sock));
        server.on('request', (req, res) => this.onRequest(req, res));
        server.setTimeout(this.config.socketTimeout);
        await new Promise<void>((resolve, reject) => {
            server.on('error', err => reject(err));
            server.listen(this.config.port, this.config.address || undefined, () => {
                this.logger.info(`${this.constructor.name}: listening on ${this.config.port}`);
                resolve();
            });
        });
    }

    async stop() {
        const server = this.server;
        if (!server) {
            return;
        }
        this.stopping = true;
        // This is required in environments like K8s where traffic is still being sent after SIGTERM
        const waitSec = Math.round(this.config.shutdownDelay / 1000);
        this.logger.info(`${this.constructor.name}: stop initiated, waiting for ${waitSec}s before stopping to accept new connections`);
        await new Promise(r => setTimeout(r, this.config.shutdownDelay));
        this.logger.info(`${this.constructor.name}: waiting for existing requests to finish`);
        const closePromise = new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
        const timeout = setTimeout(() => this.destroyAllSockets(), this.config.socketTimeout);
        this.closeIdleSockets();
        await closePromise;
        clearTimeout(timeout);
        this.server = null;
    }

    async handle(ctx: HttpContext, next: HttpNext) {
        const scope = this.createScope(this.mesh);
        scope.constant(HttpContext, ctx);
        await scope.resolve(HttpHandler).handle(ctx, next);
    }

    getServer() {
        return this.server;
    }

    protected createServer() {
        const cert = this.config.tlsCert;
        const key = this.config.tlsKey;
        if (cert && key) {
            return https.createServer({
                cert,
                key,
                ca: this.config.tlsCa,
                ciphers: this.config.tlsCiphers,
            }, (req, res) => this.handleRequest(req, res));
        }
        return http.createServer((req, res) => this.handleRequest(req, res));
    }

    protected async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        try {
            const ctx = new HttpContext(this.config, req, res);
            await this.handle(ctx, () => {
                throw new NotFoundError(`${ctx.method} ${ctx.url.pathname}`);
            });
            ctx.sendResponse();
        } catch (error: any) {
            // Minimal error handling here, should be implemented by error handler
            const status = Number(error.status) || 500;
            this.logger.error(`${this.constructor.name}: request failed`, { error });
            res.writeHead(status, { 'content-type': 'application/json' });
            res.end(JSON.stringify({
                name: error.name,
                message: error.message,
            }));
        }
    }

    /**
     * Tracks the number of pending requests per socket, so that the server could close gracefully
     */
    protected onConnection(sock: Socket) {
        this.requestsPerSocket.set(sock, 0);
        sock.once('close', () => this.requestsPerSocket.delete(sock));
    }

    /**
     * Tracks requests per connection, close connection during shutdown, when requests are served.
     */
    protected onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const socket = req.socket ?? (req as any).client;
        this.requestsPerSocket.set(socket, this.getSocketRequests(socket) + 1);
        res.once('finish', () => {
            const pending = this.getSocketRequests(socket) - 1;
            this.requestsPerSocket.set(socket, pending);
            if (this.stopping && pending === 0) {
                req.socket.end();
            }
        });
    }

    protected getSocketRequests(socket: Socket) {
        return this.requestsPerSocket.get(socket) ?? 0;
    }

    /**
     * Gracefully close idle sockets.
     */
    protected closeIdleSockets() {
        for (const [sock, count] of this.requestsPerSocket) {
            if (count === 0) {
                sock.end();
            }
        }
    }

    /**
     * Destroy all sockets non-gracefully.
     */
    protected destroyAllSockets() {
        for (const sock of this.requestsPerSocket.keys()) {
            sock.destroy();
        }
        this.requestsPerSocket.clear();
    }

}
