import { EventEmitter } from 'node:events';
import http, { STATUS_CODES } from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { Duplex } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import tls from 'node:tls';

import { DEFAULT_PROXY_CONFIG, ProxyConfig } from './config.js';
import { ConnectRetryState } from './ConnectRetryState.js';
import {
    PortDoesNotExist,
    ProxyConnectionFailed,
    ProxyConnectionTimeout,
    ServerNotInitialised,
    ServerNotListening,
} from './errors.js';
import {
    Connection,
    createConnectionId,
    createUpstreamUrl,
    Logger,
    makeBasicAuthHeader,
    ProxyStats,
    ProxyUpstream,
} from './types.js';

/**
 * Base class for implementing proxies.
 *
 * Features an HTTP server accepting both HTTP and HTTPS incoming traffic,
 * and routing such traffic either to a target destination or to the next
 * proxy in chain (aka "upstream" proxy).
 */
export class BaseProxy extends EventEmitter {

    server: http.Server | null = null;
    clientSockets = new Set<net.Socket>();
    trackedConnections = new Map<string, Connection>();
    stats: ProxyStats = { bytesRead: 0, bytesWritten: 0 };
    upstreamStats = new Map<string, ProxyStats>();
    defaultUpstream: ProxyUpstream | null;
    logger: Logger = console;
    muteErrorCodes: string[];
    warnErrorCodes: string[];
    connectRetryAttempts: number;
    connectRetryInterval: number;
    connectTimeout: number;

    constructor(options: Partial<ProxyConfig> = {}) {
        super();
        const config = { ...DEFAULT_PROXY_CONFIG, ...options };
        this.defaultUpstream = config.defaultUpstream;
        this.muteErrorCodes = config.muteErrorCodes;
        this.warnErrorCodes = config.warnErrorCodes;
        this.connectRetryAttempts = config.connectRetryAttempts;
        this.connectRetryInterval = config.connectRetryInterval;
        this.connectTimeout = config.connectTimeout;
    }

    /**
     * Hook for implementing routing logic per connection.
     *
     * Invoked from CONNECT (HTTPS) or HTTP request handlers prior to
     * establishing the onward connection.
     *
     * Return `null` for a direct connection to `host`, or upstream info
     * to connect via an upstream proxy.
     */
    matchRoute(_host: string, _request: http.IncomingMessage): ProxyUpstream | null {
        return this.defaultUpstream;
    }

    /**
     * Returns CA certificates to use when issuing HTTPS requests.
     * Override to provide custom certificates (e.g. self-signed or custom CAs).
     */
    getCACertificates(): string[] {
        return [...tls.rootCertificates];
    }

    clearStats() {
        this.stats = { bytesRead: 0, bytesWritten: 0 };
        this.upstreamStats.clear();
    }

    async start(
        port: number,
        hostname = '127.0.0.1',
        options: http.ServerOptions = {
            insecureHTTPParser: true,
            maxHeaderSize: 65535,
        },
    ) {
        await new Promise<void>((resolve, reject) => {
            this.server = http
                .createServer(options)
                .on('connection', socket => this.onConnection(socket))
                .on('request', (req, res) => this.onRequest(req, res))
                .on('connect', (req, socket) => this.onConnect(req, socket as net.Socket))
                .on('close', () => {
                    this.server = null;
                })
                .listen(port, hostname);
            this.server.on('listening', () => resolve());
            this.server.on('error', error => reject(error));
            this.clearStats();
        });
    }

    /**
     * Shuts down the proxy server.
     *
     * @param force if `true`, forcibly closes all established client connections.
     */
    async shutdown(force = false) {
        return new Promise<void>(resolve => {
            if (force) {
                this.closeAllSockets();
            }
            if (this.server) {
                this.server.on('close', resolve);
                this.server.close();
                this.server = null;
            } else {
                resolve();
            }
        });
    }

    isRunning() {
        return this.server != null;
    }

    getServerAddress(): string {
        return (this.server?.address() as net.AddressInfo)?.address ?? '';
    }

    getServerPort(): number {
        if (!this.server) {
            throw new ServerNotInitialised();
        }
        const address = this.server.address();
        if (address == null) {
            throw new ServerNotListening();
        }
        if (typeof address === 'string') {
            throw new PortDoesNotExist();
        }
        if (typeof address.port !== 'number') {
            throw new PortDoesNotExist();
        }
        return address.port;
    }

    /**
     * Forcibly closes established client connections.
     * In-flight requests fail with ECONNRESET.
     */
    closeAllSockets() {
        for (const socket of this.clientSockets) {
            socket.destroy();
        }
    }

    /**
     * Tracks established connections so they can be forcibly closed
     * by invoking `closeAllSockets`.
     */
    protected onConnection(socket: net.Socket) {
        this.clientSockets.add(socket);
        socket.on('close', () => this.clientSockets.delete(socket));
        socket.on('data', (buf: string | Buffer) => {
            this.stats.bytesRead += Buffer.byteLength(buf);
        });
        const write = socket.write.bind(socket);
        socket.write = ((buf: string | Uint8Array, ...args: unknown[]) => {
            this.stats.bytesWritten += Buffer.byteLength(buf);
            return (write as (...a: unknown[]) => boolean)(buf, ...args);
        }) as typeof socket.write;
    }

    /**
     * Error handler hook. Override for custom error handling.
     * By default logs the error unless muted via `muteErrorCodes`.
     */
    onError(error: unknown, details: Record<string, unknown> = {}) {
        const err = error as Error & { code?: string; details?: Record<string, unknown>; status?: number };
        const isMuted = err.code != null && this.muteErrorCodes.includes(err.code);
        if (isMuted) {
            return;
        }
        const isWarn = err.code != null && this.warnErrorCodes.includes(err.code);
        err.details = {
            proxyClass: this.constructor.name,
            ...err.details,
            ...details,
        };
        const method = isWarn ? this.logger.warn : this.logger.error;
        method.call(this.logger, `Proxy error: ${err.message}`, { error: err });
    }

    async authenticate(_req: http.IncomingMessage) {}

    async onConnect(req: http.IncomingMessage, clientSocket: net.Socket) {
        try {
            await this.authenticate(req);
            const upstream = this.matchRoute(req.url!, req);
            const remoteConn = await this.createSslConnection(req, upstream);
            await this.replyToConnectRequest(clientSocket, remoteConn);
            const upstreamUrl = createUpstreamUrl(upstream);
            this.collectRouteStats(upstreamUrl, clientSocket, remoteConn.socket);
            await Promise.all([
                pipeline(remoteConn.socket, clientSocket),
                pipeline(clientSocket, remoteConn.socket),
            ]);
        } catch (error: any) {
            this.onError(error, { method: req.method, url: req.url });
            const statusCode = error?.status ?? 502;
            const statusText = STATUS_CODES[statusCode];
            try {
                clientSocket.write(`HTTP/${req.httpVersion} ${statusCode} ${statusText}\r\n\r\n`);
                clientSocket.end();
            } finally {
                clientSocket.destroy();
            }
        }
    }

    protected async replyToConnectRequest(clientSocket: net.Socket, connection: Connection) {
        const lines = this.createConnectResponse(connection);
        clientSocket.write(lines.join('\r\n') + '\r\n\r\n');
    }

    /**
     * Builds the HTTP response sent to the client after CONNECT succeeds.
     * Return status line and header lines; trailing `\r\n\r\n` is added when writing.
     */
    protected createConnectResponse(connection: Connection): string[] {
        return [
            'HTTP/1.1 200 OK',
            `X-Connection-Id: ${connection.connectionId}`,
        ];
    }

    /**
     * Creates an onward connection to `host` either directly or via upstream proxy.
     */
    async createSslConnection(
        inboundConnectReq: http.IncomingMessage,
        upstream: ProxyUpstream | null,
    ): Promise<Connection> {
        const connection = await this.sslConnectWithRetry(inboundConnectReq, upstream);
        const { connectionId, socket } = connection;
        this.trackedConnections.set(connectionId, connection);
        socket.on('close', () => this.trackedConnections.delete(connectionId));
        const partitionId = String(inboundConnectReq.headers['x-partition-id'] || '');
        if (partitionId) {
            connection.partitionId = partitionId;
        }
        return connection;
    }

    /**
     * Establishes onward connections with retry logic:
     * - first attempt is made immediately
     * - subsequent attempts are scheduled at `connectRetryInterval`
     * - first successful connection wins; others are destroyed
     * - each attempt is capped by `connectTimeout`
     */
    /**
     * Starts up to `connectRetryAttempts + 1` parallel connect attempts,
     * staggered by `connectRetryInterval`.
     *
     * The first successful connection is used. Pending timers are cleared and
     * sockets from the other attempts are destroyed.
     */
    protected sslConnectWithRetry(
        inboundConnectReq: http.IncomingMessage,
        upstream: ProxyUpstream | null,
    ): Promise<Connection> {
        const totalAttempts = this.connectRetryAttempts + 1;
        return new Promise((resolve, reject) => {
            const state = new ConnectRetryState();
            const tryConnect = async (attempt: number) => {
                if (state.completed) {
                    return;
                }
                try {
                    this.emit('outboundConnect', { inboundConnectReq, upstream, attempt });
                    const connection = upstream ?
                        await this.sslProxyConnect(inboundConnectReq, upstream, state.trackSocket) :
                        await this.sslDirectConnect(inboundConnectReq, state.trackSocket);
                    if (state.completed) {
                        connection.socket.destroy();
                        return;
                    }
                    state.complete(connection.socket);
                    resolve(connection);
                } catch (error: any) {
                    state.failures += 1;
                    if (!state.completed && state.failures >= totalAttempts) {
                        state.cancel();
                        reject(error);
                    }
                }
            };
            for (let i = 0; i < totalAttempts; i++) {
                state.timers.push(setTimeout(() => tryConnect(i), i * this.connectRetryInterval));
            }
        });
    }

    protected async sslProxyConnect(
        inboundConnectReq: http.IncomingMessage,
        upstream: ProxyUpstream,
        onSocket?: (socket: net.Socket) => void,
    ): Promise<Connection> {
        const host = inboundConnectReq.url!;
        const connectReq = this.createConnectRequest(inboundConnectReq, upstream);
        const [connectRes, socket] = await new Promise<[http.IncomingMessage, net.Socket]>(
            (resolve, reject) => {
                connectReq.on('socket', socket => onSocket?.(socket));
                connectReq.on('error', reject);
                connectReq.on('timeout', () => {
                    connectReq.destroy();
                    reject(new ProxyConnectionTimeout(upstream));
                });
                connectReq.on('connect', (res, remoteSocket: Duplex) => {
                    resolve([res, remoteSocket as net.Socket]);
                });
                connectReq.end();
            },
        );
        if ((connectRes.statusCode ?? 0) >= 400) {
            socket.destroy();
            throw new ProxyConnectionFailed(upstream, connectRes.statusCode!);
        }
        const connectionIdHeader = String(connectRes.headers['x-connection-id'] || '');
        const connectionId = connectionIdHeader || createConnectionId();
        return { connectionId, host, upstream, socket };
    }

    protected async sslDirectConnect(
        inboundConnectReq: http.IncomingMessage,
        onSocket?: (socket: net.Socket) => void,
    ): Promise<Connection> {
        const host = inboundConnectReq.url!;
        const connectionId = createConnectionId();
        const socket = await new Promise<net.Socket>((resolve, reject) => {
            const url = new URL(`https://${host}`);
            const port = Number(url.port) || 443;
            const conn = net.connect(port, url.hostname);
            onSocket?.(conn);
            conn.setTimeout(this.connectTimeout);
            conn.on('error', reject);
            conn.on('connect', () => resolve(conn));
            conn.on('timeout', () => {
                conn.destroy();
                reject(new ProxyConnectionTimeout(null));
            });
        });
        return { connectionId, host, socket, upstream: null };
    }

    protected createConnectRequest(
        inboundConnectReq: http.IncomingMessage,
        upstream: ProxyUpstream,
    ): http.ClientRequest {
        const targetHost = inboundConnectReq.url!;
        const { useHttps = false } = upstream;
        const [hostname, port] = upstream.host.split(':');
        const request = useHttps ? https.request : http.request;
        const connectReq = request({
            hostname,
            port,
            path: targetHost,
            method: 'CONNECT',
            headers: { host: targetHost },
            agent: false,
            timeout: this.connectTimeout,
            ca: this.getCACertificates(),
            ALPNProtocols: ['http/1.1'],
            servername: hostname,
        } as https.RequestOptions);
        if (upstream.username || upstream.password) {
            connectReq.setHeader('Proxy-Authorization', makeBasicAuthHeader(upstream));
        }
        const partitionId = inboundConnectReq.headers['x-partition-id'];
        if (partitionId) {
            connectReq.setHeader('X-Partition-Id', partitionId);
        }
        return connectReq;
    }

    async onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        try {
            await this.authenticate(req);
            const { host } = new URL(req.url!);
            const upstream = this.matchRoute(host, req);
            const fwdReq = upstream ?
                this.createProxyHttpRequest(req, upstream) :
                this.createDirectHttpRequest(req);
            const fwdRes = await new Promise<http.IncomingMessage>((resolve, reject) => {
                fwdReq.on('error', reject);
                fwdReq.on('response', response => resolve(response));
                pipeline(req, fwdReq).catch(reject);
            });
            res.writeHead(fwdRes.statusCode ?? 599, fwdRes.headers);
            await pipeline(fwdRes, res);
        } catch (error: any) {
            this.onError(error, { method: req.method, url: req.url });
            if (!res.headersSent) {
                const statusCode = error?.status ?? 502;
                res.writeHead(statusCode);
            }
            res.end();
        }
    }

    protected createProxyHttpRequest(
        req: http.IncomingMessage,
        upstream: ProxyUpstream,
    ): http.ClientRequest {
        const [hostname, port] = upstream.host.split(':');
        const options: http.RequestOptions = {
            hostname,
            port,
            path: req.url,
            method: req.method,
            headers: req.headers,
            timeout: this.connectTimeout,
        };
        const fwdReq = upstream.useHttps ?
            https.request({ ...options, ca: this.getCACertificates() }) :
            http.request(options);
        if (upstream.username || upstream.password) {
            fwdReq.setHeader('Proxy-Authorization', makeBasicAuthHeader(upstream));
        }
        return fwdReq;
    }

    protected createDirectHttpRequest(req: http.IncomingMessage): http.ClientRequest {
        const { hostname, port = 80, pathname, search } = new URL(req.url!);
        return http.request({
            hostname,
            port,
            path: pathname + search,
            method: req.method,
            headers: req.headers,
            timeout: this.connectTimeout,
        });
    }

    protected collectRouteStats(
        upstreamUrl: string,
        clientSocket: net.Socket,
        remoteSocket: net.Socket,
    ) {
        clientSocket.on('data', (buf: string | Buffer) => {
            const size = Buffer.byteLength(buf);
            const bucket = this.upstreamStats.get(upstreamUrl);
            if (bucket) {
                bucket.bytesRead += size;
            } else {
                this.upstreamStats.set(upstreamUrl, {
                    bytesRead: size,
                    bytesWritten: 0,
                });
            }
        });
        remoteSocket.on('data', (buf: string | Buffer) => {
            const size = Buffer.byteLength(buf);
            const bucket = this.upstreamStats.get(upstreamUrl);
            if (bucket) {
                bucket.bytesWritten += size;
            } else {
                this.upstreamStats.set(upstreamUrl, {
                    bytesRead: 0,
                    bytesWritten: size,
                });
            }
        });
    }

}
