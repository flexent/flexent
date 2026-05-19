import { HttpContext } from './HttpContext.js';

export type HttpNext = () => Promise<void>;

export type HttpHandlerFn = (ctx: HttpContext, next: HttpNext) => Promise<void>;

/**
 * Dictionary used to store parsed querystring and headers,
 * both of which can have multiple values per key.
 */
export type HttpDict = Record<string, string[]>;
