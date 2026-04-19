import { HistogramMetric, metric } from '@flexent/metrics';

import { type RouteDefinition } from './types.js';

export class RouteMetrics {

    @metric()
    routeLatency = new HistogramMetric<{ method: string; path: string }>(
        'global_route_latency_seconds', 'Application Route Latency');

    logLatency(route: RouteDefinition, startedAt: number) {
        const latency = Date.now() - startedAt;
        this.routeLatency.addMillis(latency, {
            method: route.method,
            path: route.path,
        });
    }

}
