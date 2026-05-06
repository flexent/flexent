import { NotFoundError } from '@flexent/errors';
import { type HttpContext, HttpHandler, type HttpNext } from '@flexent/http-server';
import { type Logger } from '@flexent/logger';
import {
    type DomainMethod,
    type DomainMethodStat,
    MethodNotFound,
    type ProtocolIndex,
} from '@flexent/protocomm';
import { dep } from 'mesh-ioc';
import { Event } from 'nanoevent';

export abstract class HttpProtocolHandler<P> extends HttpHandler {

    @dep() protected logger!: Logger;

    methodStats = new Event<DomainMethodStat>();

    prefix = '';

    abstract get protocol(): ProtocolIndex<P>;

    abstract get protocolImpl(): P;

    async handle(ctx: HttpContext, next: HttpNext): Promise<void> {
        if (!ctx.path.startsWith(this.prefix)) {
            return await next();
        }
        const [domainName, methodName] = this.parsePath(ctx.path);
        const startedAt = Date.now();
        try {
            await this.handleProtocolMethod(ctx, next, domainName, methodName);
            this.methodStats.emit({
                domain: domainName,
                method: methodName,
                latency: Date.now() - startedAt,
            });
        } catch (error: any) {
            this.methodStats.emit({
                domain: domainName,
                method: methodName,
                latency: Date.now() - startedAt,
                error: error.name,
            });
            throw error;
        }
    }

    protected async handleProtocolMethod(
        ctx: HttpContext,
        next: HttpNext,
        domainName: string,
        methodName: string,
    ): Promise<void> {
        const { methodDef, reqSchema, resSchema } = this.protocol.lookupMethod(domainName, methodName);
        const expectedMethod = methodDef.type === 'query' ? 'GET' : 'POST';
        if (ctx.method !== expectedMethod) {
            return await next();
        }
        const params = await this.parseParams(ctx);
        const decodedParams = reqSchema.decode(params, { strictRequired: true });
        this.logger.debug(`>>> ${domainName}.${methodName}`, { params: decodedParams });
        const domainImpl = (this.protocolImpl as any)[domainName];
        const methodImpl = domainImpl?.[methodName] as DomainMethod<any, any> | undefined;
        if (!methodImpl) {
            throw new MethodNotFound(`${domainName}.${methodName}`);
        }
        ctx.state.domainName = domainName;
        ctx.state.methodName = methodName;
        ctx.state.methodDef = methodDef;
        ctx.state.params = decodedParams;
        const res = await methodImpl.call(domainImpl, decodedParams);
        const decodedRes = resSchema.decode(res);
        this.logger.debug(`<<< ${domainName}.${methodName}`, { result: decodedRes });
        ctx.status = 200;
        ctx.responseBody = decodedRes;
    }

    protected parsePath(path: string): [string, string] {
        if (!path.startsWith(this.prefix)) {
            throw new NotFoundError('Endpoint not found');
        }
        const pathWithoutPrefix = path.substring(this.prefix.length);
        const match = /^\/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)$/.exec(pathWithoutPrefix);
        if (!match) {
            throw new NotFoundError('Endpoint not found');
        }
        return [match[1], match[2]];
    }

    protected async parseParams(ctx: HttpContext): Promise<unknown> {
        if (ctx.method === 'GET') {
            return ctx.query;
        }
        const body = await ctx.readRequestBody();
        return body ?? {};
    }

}
