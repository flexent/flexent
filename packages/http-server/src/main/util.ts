import { HttpContext } from './HttpContext.js';
import { HttpDict } from './HttpDict.js';
import { HttpHandler, HttpHandlerFn, HttpNext } from './HttpHandler.js';

export const TypedArray = Object.getPrototypeOf(Uint8Array);

export type RequestBodyType = 'auto' | 'raw' | 'json' | 'text' | 'urlencoded';

export function headersToDict(headers: Record<string, string | string[] | undefined>): HttpDict {
    const dict: HttpDict = Object.create(null);
    for (const [key, value] of Object.entries(headers)) {
        const val = Array.isArray(value) ? value : [value ?? ''];
        dict[key.toLowerCase()] = val;
    }
    return dict;
}

export function searchParamsToDict(search: URLSearchParams): HttpDict {
    const dict: HttpDict = Object.create(null);
    for (const [key, value] of search) {
        const values = dict[key] ?? [];
        values.push(value);
        dict[key] = values;
    }
    return dict;
}

export function composeHandlers(handlers: HttpHandler[]): HttpHandler {
    const fns = handlers.map<HttpHandlerFn>(_ => {
        return (ctx, next) => _.handle(ctx, next);
    });
    return {
        handle: compose(fns),
    };
}

export function compose(fns: HttpHandlerFn[]): HttpHandlerFn {
    return async (ctx: HttpContext, next: HttpNext) => {
        const dispatch = async (index: number) => {
            if (index >= fns.length) {
                return await next();
            }
            const fn = fns[index];
            await fn(ctx, () => dispatch(index + 1));
        };
        return await dispatch(0);
    };
}
