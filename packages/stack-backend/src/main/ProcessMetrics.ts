import { DynamicGaugeMetric, metric } from '@luminable/metrics';

const process = global.process;

export class ProcessMetrics {

    @metric()
    cpuUsage = new DynamicGaugeMetric<{ type: string }>(() => {
        const cpuUsage = process.cpuUsage();
        return [
            { labels: { type: 'user' }, value: cpuUsage.user },
            { labels: { type: 'system' }, value: cpuUsage.system },
        ];
    }, 'app_process_cpu_usage', 'Process Memory Usage');

    @metric()
    memoryUsage = new DynamicGaugeMetric<{ type: string }>(() => {
        const memoryUsage = process.memoryUsage();
        return [
            { labels: { type: 'rss' }, value: memoryUsage.rss },
            { labels: { type: 'heapUsed' }, value: memoryUsage.heapUsed },
            { labels: { type: 'heapTotal' }, value: memoryUsage.heapTotal },
            { labels: { type: 'arrayBuffers' }, value: memoryUsage.arrayBuffers },
            { labels: { type: 'external' }, value: memoryUsage.external },
        ];
    }, 'app_process_memory_usage', 'Process Memory Usage');

}
