import { ProxyUpstream } from './types.js';

export class ProxyConnectionFailed extends Error {

    override name = this.constructor.name;
    status: number;
    details: Record<string, unknown>;

    constructor(upstream: ProxyUpstream, status: number) {
        super(`Proxy connection failed: upstream returned ${status}`);
        this.status = status;
        this.details = { upstream: { ...upstream, password: '***' }, status };
    }

}

export class ProxyConnectionTimeout extends Error {

    override name = this.constructor.name;
    details: Record<string, unknown>;

    constructor(upstream: ProxyUpstream | null) {
        super('Proxy connection timeout');
        this.details = { upstream: { ...upstream, password: '***' } };
    }

}

export class ServerNotInitialised extends Error {

    override name = this.constructor.name;
    override message = 'The listening server has not been initialised. Did you call .start()?';

}

export class ServerNotListening extends Error {

    override name = this.constructor.name;
    override message = 'The server is not listening. Did you call .start()?';

}

export class PortDoesNotExist extends Error {

    override name = this.constructor.name;
    override message = 'The server is not listening to an IP socket.';

}

export class RemoteConnectionNotAuthorized extends Error {

    override name = this.constructor.name;
    details: Record<string, unknown>;

    constructor(cause: Error) {
        super(`Remote connection not authorized: ${cause.message}`);
        this.details = { cause: { ...cause } };
    }

}
