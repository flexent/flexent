import http from 'node:http';
import net from 'node:net';
import { pipeline } from 'node:stream/promises';
import tls from 'node:tls';

import { BaseProxy } from './BaseProxy.js';
import { ProxyConfig } from './config.js';
import { RemoteConnectionNotAuthorized } from './errors.js';
import { SslCertStore } from './SslCertStore.js';
import { Connection } from './types.js';

/**
 * An SSL man-in-the-middle proxy which allows inspecting HTTPS traffic
 * and implementing custom routing, request/response rewriting, and forwarding.
 *
 * SSL MITM uses [SSL Bumping](https://wiki.squid-cache.org/Features/SslBump):
 * the server generates a certificate for each inbound client connection,
 * presenting itself as the destination host and signing with a provided CA.
 *
 * Clients must trust that CA (or otherwise accept the forged certificates).
 * Disabling certificate validation on the client is insecure and not recommended.
 */
export class SslBumpProxy extends BaseProxy {

    sslBumpConfig: SslBumpConfig;
    certStore: SslCertStore;

    constructor(config: SslBumpConfig & Partial<ProxyConfig>) {
        super(config);
        this.sslBumpConfig = config;
        this.certStore = new SslCertStore(config);
    }

    override getCACertificates() {
        return [this.sslBumpConfig.caCert, ...super.getCACertificates()];
    }

    override async onConnect(req: http.IncomingMessage, clientSocket: net.Socket) {
        try {
            await this.authenticate(req);
            const targetHost = req.url ?? '';
            const [hostname, rawPort] = targetHost.split(':');
            const port = Number(rawPort) || 443;
            const upstream = this.matchRoute(targetHost, req);
            const connection = await this.createSslConnection(req, upstream);
            const tlsRemoteSocket = await this.negotiateTls(connection.socket, hostname, port);
            // Reply to CONNECT before starting the client TLS handshake.
            await this.replyToConnectRequest(clientSocket, connection);
            const tlsClientSocket = this.certStore.bumpClientSocket(hostname, clientSocket);
            tlsRemoteSocket.on('close', () => tlsClientSocket.end());
            tlsClientSocket.on('close', () => tlsRemoteSocket.end());
            await this.handleTls(tlsClientSocket, tlsRemoteSocket, connection);
        } catch (error) {
            this.onError(error, { method: req.method, url: req.url });
            const statusCode = (error as { status?: number }).status ?? 502;
            const statusText = http.STATUS_CODES[statusCode];
            try {
                clientSocket.write(`HTTP/${req.httpVersion} ${statusCode} ${statusText}\r\n\r\n`);
                clientSocket.end();
            } finally {
                clientSocket.destroy();
            }
        }
    }

    /**
     * Hook into decrypted SSL traffic between client and remote.
     * Defaults to bidirectional passthrough. Override for custom logic.
     */
    async handleTls(
        tlsClientSocket: net.Socket,
        tlsRemoteSocket: net.Socket,
        _connection: Connection,
    ): Promise<void> {
        await Promise.all([
            pipeline(tlsClientSocket, tlsRemoteSocket),
            pipeline(tlsRemoteSocket, tlsClientSocket),
        ]);
    }

    protected async negotiateTls(remoteSocket: net.Socket, hostname: string, port: number) {
        const tlsRemoteSocket = tls.connect({
            socket: remoteSocket,
            host: hostname,
            port,
            servername: hostname,
            timeout: 60000,
            ca: this.getCACertificates(),
        }).setTimeout(60000, () => remoteSocket.end());
        await new Promise<void>((resolve, reject) => {
            tlsRemoteSocket.once('secureConnect', () => resolve());
            tlsRemoteSocket.once('error', reject);
        });
        if (!tlsRemoteSocket.authorized) {
            tlsRemoteSocket.destroy();
            throw new RemoteConnectionNotAuthorized(tlsRemoteSocket.authorizationError);
        }
        return tlsRemoteSocket;
    }

}

export interface SslBumpConfig {
    /**
     * PEM-encoded CA certificate used to issue temporary certificates.
     */
    caCert: string;
    /**
     * PEM-encoded private key for signing temporary certificates.
     */
    caPrivateKey: string;
    /**
     * Number of days until temporary certificates expire (also used for cache TTL).
     */
    certTtlDays: number;
    /**
     * Maximum number of cached certificates stored simultaneously.
     */
    certCacheMaxEntries: number;
}
