import { HttpChain, type HttpErrorHandler } from '@luminable/http-server';
import { dep } from 'mesh-ioc';

import { type MetaRouter } from './MetaRouter.js';

export class MetaHandler extends HttpChain {

    @dep() protected errorHandler!: HttpErrorHandler;
    @dep() protected metaRouter!: MetaRouter;

    handlers = [
        this.errorHandler,
        this.metaRouter,
    ];

}
