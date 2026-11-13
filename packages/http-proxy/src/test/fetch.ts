import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';

export interface TestFetchOptions {
    /** Proxy origin, e.g. `http://127.0.0.1:8080`. */
    proxy?: string;
    method?: string;
    body?: string;
    ca?: string | string[];
}

export interface TestFetchResult {
    status: number;
    text: string;
    socket: net.Socket | tls.TLSSocket | null;
}

/**
 * Minimal test client that can send requests directly or via an HTTP proxy.
 */
export async function testFetch(url: string, options: TestFetchOptions = {}): Promise<TestFetchResult> {
    if (options.proxy) {
        return fetchViaProxy(url, options.proxy, options);
    }
    return fetchDirect(url, options);
}

async function fetchDirect(url: string, options: TestFetchOptions): Promise<TestFetchResult> {
    const target = new URL(url);
    const isHttps = target.protocol === 'https:';
    const lib = isHttps ? https : http;
    const requestOptions: https.RequestOptions = {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: target.pathname + target.search,
        method: options.method ?? 'GET',
        headers: {},
        ca: options.ca,
    };
    if (options.body) {
        requestOptions.headers = {
            'content-length': Buffer.byteLength(options.body),
        };
    }
    return sendRequest(lib.request(requestOptions), options.body);
}

async function fetchViaProxy(
    url: string,
    proxyUrl: string,
    options: TestFetchOptions,
): Promise<TestFetchResult> {
    const target = new URL(url);
    const proxy = new URL(proxyUrl);
    if (target.protocol === 'http:') {
        return fetchHttpViaProxy(target, proxy, options);
    }
    return fetchHttpsViaProxy(target, proxy, options);
}

async function fetchHttpViaProxy(
    target: URL,
    proxy: URL,
    options: TestFetchOptions,
): Promise<TestFetchResult> {
    const headers: http.OutgoingHttpHeaders = {
        host: target.host,
    };
    if (options.body) {
        headers['content-length'] = Buffer.byteLength(options.body);
    }
    const request = http.request({
        hostname: proxy.hostname,
        port: proxy.port,
        path: target.href,
        method: options.method ?? 'GET',
        headers,
    });
    return sendRequest(request, options.body);
}

async function fetchHttpsViaProxy(
    target: URL,
    proxy: URL,
    options: TestFetchOptions,
): Promise<TestFetchResult> {
    const connectSocket = await connectThroughProxy(target, proxy);
    const tlsSocket = await handshakeTls(connectSocket, target, options.ca);
    const headers: http.OutgoingHttpHeaders = {
        host: target.host,
    };
    if (options.body) {
        headers['content-length'] = Buffer.byteLength(options.body);
    }
    const request = http.request({
        method: options.method ?? 'GET',
        path: target.pathname + target.search,
        headers,
        createConnection: () => tlsSocket,
    });
    return sendRequest(request, options.body);
}

function sendRequest(request: http.ClientRequest, body?: string): Promise<TestFetchResult> {
    return new Promise((resolve, reject) => {
        request.on('response', response => {
            const chunks: Buffer[] = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
                resolve({
                    status: response.statusCode ?? 0,
                    text: Buffer.concat(chunks).toString('utf8'),
                    socket: request.socket,
                });
            });
        });
        request.on('error', reject);
        if (body) {
            request.write(body);
        }
        request.end();
    });
}

export async function connectThroughProxy(target: URL, proxy: URL): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
        const request = http.request({
            hostname: proxy.hostname,
            port: proxy.port,
            path: target.host,
            method: 'CONNECT',
            headers: { host: target.host },
        });
        request.on('connect', (res, socket) => {
            if ((res.statusCode ?? 0) >= 400) {
                socket.destroy();
                reject(new Error(`CONNECT failed with ${res.statusCode}`));
                return;
            }
            resolve(socket as net.Socket);
        });
        request.on('error', reject);
        request.end();
    });
}

export async function handshakeTls(
    socket: net.Socket,
    target: URL,
    ca?: string | string[],
): Promise<tls.TLSSocket> {
    const tlsSocket = tls.connect({
        socket,
        host: target.hostname,
        servername: target.hostname,
        ca,
        ALPNProtocols: ['http/1.1'],
    });
    await new Promise<void>((resolve, reject) => {
        tlsSocket.once('secureConnect', () => resolve());
        tlsSocket.once('error', reject);
    });
    return tlsSocket;
}

export function proxyOrigin(port: number) {
    return `http://127.0.0.1:${port}`;
}
