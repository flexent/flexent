import { HttpRequestError, RequestFailedError, UnexpectedResponseError } from './errors.js';
import { ProtocolIndex, ProtocolMethodDesc } from './ProtocolIndex.js';
import { RpcError } from './types.js';

export type FetchFn = (fullUrl: string, options?: FetchOptions) => Promise<Response>;

export interface FetchOptions {
    method?: string;
    body?: any;
    headers?: RequestHeaders;
    mode?: 'cors' | 'no-cors' | 'same-origin';
    credentials?: 'include' | 'omit' | 'same-origin';
}

export type RequestHeaders = Record<string, string>;

export interface HttpClientConfig {
    baseUrl: string;
    fetch?: FetchFn;
    headers?: RequestHeaders;
}

interface HttpClientRequest {
    method: 'GET' | 'POST';
    url: URL;
    body?: string;
}

/**
 * Client for calling protocol methods over HTTP:
 * queries are sent as GET with query parameters, commands as POST with a JSON body.
 */
export class HttpClient<P> {

    readonly client: P;

    constructor(
        readonly index: ProtocolIndex<P>,
        readonly config: HttpClientConfig,
    ) {
        this.client = this.createClient();
    }

    protected createClient(): P {
        const result: any = {};
        for (const [domainName, domainDef] of this.index) {
            const methods: any = {};
            result[domainName] = methods;
            for (const methodName of Object.keys(domainDef.methods)) {
                const methodDesc = this.index.lookupMethod(domainName, methodName);
                methods[methodName] = (params: unknown) => this.callMethod(methodDesc, params);
            }
        }
        return result;
    }

    protected async callMethod(methodDesc: ProtocolMethodDesc, params: unknown): Promise<unknown> {
        const request = this.createRequest(methodDesc, params ?? {});
        const fetch = this.config.fetch ?? globalThis.fetch;
        const res = await fetch(request.url.toString(), {
            method: request.method,
            headers: {
                'content-type': 'application/json',
                ...this.config.headers,
            },
            mode: 'cors',
            credentials: 'include',
            body: request.body,
        }).catch(error => {
            throw new RequestFailedError(error, request.url.toString());
        });
        if (!res.ok) {
            throw this.decodeError(res.status, request, await res.text());
        }
        return await res.json().catch(error => {
            throw new UnexpectedResponseError(error);
        });
    }

    protected createRequest(methodDesc: ProtocolMethodDesc, params: object): HttpClientRequest {
        const baseUrl = this.config.baseUrl.endsWith('/') ? this.config.baseUrl : this.config.baseUrl + '/';
        const url = new URL(`${methodDesc.domainDef.name}/${methodDesc.methodName}`, baseUrl);
        if (methodDesc.methodDef.type === 'command') {
            return {
                method: 'POST',
                url,
                body: JSON.stringify(params),
            };
        }
        for (const [key, value] of Object.entries(params)) {
            for (const item of [value].flat()) {
                if (item !== undefined) {
                    url.searchParams.append(key, item);
                }
            }
        }
        return {
            method: 'GET',
            url,
        };
    }

    /**
     * A response body in `RpcError` shape becomes an error with its name, message and details.
     * Anything else becomes an `HttpRequestError` that carries the body.
     */
    protected decodeError(status: number, request: HttpClientRequest, responseText: string): Error {
        const details = this.parseResponseText(responseText);
        try {
            const rpcError = RpcError.decode(details, { strictRequired: true });
            const error = new Error(rpcError.message) as any;
            error.name = rpcError.name;
            error.details = rpcError.details;
            error.status = status;
            return error;
        } catch {
            return new HttpRequestError({
                status,
                method: request.method,
                url: request.url.toString(),
                details,
            });
        }
    }

    private parseResponseText(responseText: string): unknown {
        try {
            return JSON.parse(responseText);
        } catch {
            return { response: responseText };
        }
    }

}
