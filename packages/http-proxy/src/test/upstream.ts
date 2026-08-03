import http from 'node:http';
import net from 'node:net';

import { BaseProxy } from '../main/BaseProxy.js';
import { certificate } from './certs.js';
import { testLogger } from './logger.js';

/**
 * Tiny proxy that connects directly to the destination (intermediate upstream).
 */
export class UpstreamProxy extends BaseProxy {

    interceptedHttpRequest: http.IncomingMessage | null = null;
    interceptedConnectRequest: http.IncomingMessage | null = null;
    errorOnConnect: Error | null = null;
    delayOnConnect = 0;
    connectAttempts = 0;

    constructor() {
        super();
        this.logger = testLogger;
        this.on('outboundConnect', () => {
            this.connectAttempts += 1;
        });
    }

    override getCACertificates() {
        return [...super.getCACertificates(), certificate];
    }

    reset() {
        this.interceptedHttpRequest = null;
        this.interceptedConnectRequest = null;
        this.errorOnConnect = null;
        this.delayOnConnect = 0;
    }

    override async onConnect(req: http.IncomingMessage, clientSocket: net.Socket) {
        this.interceptedConnectRequest = req;
        await super.onConnect(req, clientSocket);
    }

    override async onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        this.interceptedHttpRequest = req;
        await super.onRequest(req, res);
    }

    override async authenticate(_req: http.IncomingMessage) {
        await this.simulateConnectDelay();
        await this.simulateConnectError();
    }

    async simulateConnectDelay() {
        if (this.delayOnConnect) {
            await new Promise(r => setTimeout(r, this.delayOnConnect));
        }
    }

    async simulateConnectError() {
        if (this.errorOnConnect) {
            throw this.errorOnConnect;
        }
    }

}
