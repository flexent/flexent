import http, { STATUS_CODES } from 'node:http';
import https from 'node:https';
import { TLSSocket } from 'node:tls';

import { certificate, privateKey } from './certs.js';

export const httpServer = http.createServer(handler);

export const httpsServer = https.createServer({
    cert: certificate,
    key: privateKey,
}, handler);

async function handler(req: http.IncomingMessage, res: http.ServerResponse) {
    const isHttps = req.socket instanceof TLSSocket && req.socket.encrypted;
    const bodyChunks: Buffer[] = [];
    for await (const chunk of req) {
        bodyChunks.push(chunk as Buffer);
    }
    res.writeHead(200, STATUS_CODES[200], {
        'content-type': 'text/plain',
    });
    const responseLines = [
        `You requested ${req.method} ${req.url} over ${isHttps ? 'https' : 'http'}`,
        Buffer.concat(bodyChunks).toString('utf-8'),
    ];
    res.end(responseLines.filter(Boolean).join('\n'));
}

export async function startServer(server: http.Server, port: number) {
    await new Promise<void>((resolve, reject) => {
        server.listen(port, () => resolve()).on('error', reject);
    });
}
