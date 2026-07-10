import { once } from 'node:events';
import net from 'node:net';
import { Duplex } from 'node:stream';
import tls from 'node:tls';

export async function connectToUrl(url: URL | string): Promise<Duplex> {
    const target = typeof url === 'string' ? new URL(url) : url;
    if (target.protocol === 'wss:' || target.protocol === 'https:') {
        const hostname = target.hostname;
        const socket = tls.connect({
            host: hostname,
            port: target.port ? Number(target.port) : 443,
            ...(net.isIP(hostname) ? {} : { servername: hostname }),
        });
        await once(socket, 'secureConnect');
        return socket;
    }
    if (target.protocol === 'ws:' || target.protocol === 'http:') {
        const socket = net.connect(
            target.port ? Number(target.port) : 80,
            target.hostname,
        );
        await once(socket, 'connect');
        return socket;
    }
    throw new Error(`Unsupported URL protocol: ${target.protocol}`);
}
