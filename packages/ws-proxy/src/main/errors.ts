export class WsProxyError extends Error {

    override name = 'WsProxyError';

    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
    }

}
