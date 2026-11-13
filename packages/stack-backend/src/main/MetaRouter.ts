import { Get, HttpRouter } from '@flexent/http-router';
import { HttpContext } from '@flexent/http-server';
import { generateMetricsReport } from '@flexent/metrics';
import { config } from 'mesh-config';
import { findMembers } from 'mesh-decorators';
import { dep, Mesh } from 'mesh-ioc';

import { STATUS_CHECK } from './utils/status.js';

export class MetaRouter extends HttpRouter {

    @dep() private mesh!: Mesh;

    @config({ default: '' }) private APP_VERSION!: string;

    @Get({ path: '/status' })
    async getStatus(ctx: HttpContext) {
        const checks = await this.runStatusChecks();
        ctx.responseBody = {
            version: this.APP_VERSION,
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

    private async runStatusChecks() {
        const checks: Record<string, string> = {};
        const refs = findMembers(STATUS_CHECK, this.mesh);
        const results = await Promise.all(refs.map(ref => ref.target[ref.memberName]()));
        for (const [i, ref] of refs.entries()) {
            checks[ref.target.constructor.name] = results[i];
        }
        return checks;
    }

}
