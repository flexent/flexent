import { createChain, HttpErrorHandler, HttpHandler } from '@luminable/http-server';
import { dep, Mesh } from 'mesh-ioc';

import { MetaRouter } from './MetaRouter.js';

export class MetaScope extends Mesh {

    @dep() private errorHandler!: HttpErrorHandler;
    @dep() private metaRouter!: MetaRouter;

    constructor(parent: Mesh) {
        super('Meta', parent);
        this.connect(this);
        this.service(MetaRouter);
        this.constant(HttpHandler, createChain([
            this.errorHandler,
            this.metaRouter,
        ]));
    }

}
