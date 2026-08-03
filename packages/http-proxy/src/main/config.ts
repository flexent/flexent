import { ProxyUpstream } from './types.js';

/**
 * Proxy configuration object.
 */
export interface ProxyConfig {
    /**
     * Default upstream proxy used when no custom routing logic matches.
     */
    defaultUpstream: ProxyUpstream | null;
    /**
     * Node.js error codes to ignore and not log at all.
     * See https://nodejs.org/api/errors.html#nodejs-error-codes
     */
    muteErrorCodes: string[];
    /**
     * Node.js error codes to treat as warnings instead of errors.
     * See https://nodejs.org/api/errors.html#nodejs-error-codes
     */
    warnErrorCodes: string[];
    /**
     * Number of times to retry outbound connections until giving up.
     */
    connectRetryAttempts: number;
    /**
     * Interval between retrying to establish outbound connections.
     */
    connectRetryInterval: number;
    /**
     * Timeout for establishing outbound connections.
     */
    connectTimeout: number;
}

export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
    defaultUpstream: null,
    muteErrorCodes: [
        'EPIPE',
        'ERR_STREAM_PREMATURE_CLOSE',
        'ERR_STREAM_DESTROYED',
        'ECONNRESET',
        'EINVAL',
    ],
    warnErrorCodes: [
        'ENOTCONN',
        'ERR_STREAM_WRITE_AFTER_END',
        'EPROTO',
    ],
    connectRetryAttempts: 0,
    connectRetryInterval: 1000,
    connectTimeout: 10000,
};
