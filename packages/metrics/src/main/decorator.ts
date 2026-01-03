import { createMemberDecorator, findMembers } from 'mesh-decorators';
import { Mesh } from 'mesh-ioc';

import { BaseMetric } from './BaseMetric.js';

export const metric = createMemberDecorator('@nodescript/metric');

export function findMetrics(mesh: Mesh): BaseMetric[] {
    const metrics: BaseMetric[] = [];
    const refs = findMembers('@nodescript/metric', mesh);

    for (const { target, memberName } of refs) {
        const value = target[memberName];
        if (value instanceof BaseMetric) {
            metrics.push(value);
        }
    }
    return metrics;
}

export function generateMetricsReport(mesh: Mesh) {
    const all = [...findMetrics(mesh)];
    return all.map(_ => _.report()).join('\n\n');
}
