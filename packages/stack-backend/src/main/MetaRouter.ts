import fs from 'node:fs';

import { Get, HttpRouter } from '@luminable/http-router';
import { HttpContext } from '@luminable/http-server';
import { generateMetricsReport } from '@luminable/metrics';
import { dep, Mesh } from 'mesh-ioc';

import { invokeStatusChecks } from './utils/status.js';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

export class MetaRouter extends HttpRouter {

    @dep() private mesh!: Mesh;

    @Get({ path: '/status' })
    async getStatus(ctx: HttpContext) {
        const checks = await invokeStatusChecks(this.mesh);
        ctx.responseBody = {
            version: pkg.version,
            ...checks,
        };
        ctx.status = 200;
        ctx.log = false;
    }

    @Get({ path: '/metrics' })
    async getMetrics(ctx: HttpContext) {
        const report = generateMetricsReport(this.mesh);
        ctx.status = 200;
        ctx.responseBody = report;
        ctx.log = false;
    }

}
