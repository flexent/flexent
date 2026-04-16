import { type HttpContext } from './HttpContext.js';
import { type HttpNext } from './types.js';

export abstract class HttpHandler {

    abstract handle(ctx: HttpContext, next: HttpNext): Promise<void>;

}
