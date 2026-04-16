import { BaseMetric, type MetricDatum } from './BaseMetric.js';

export class GaugeMetric<L = any> extends BaseMetric<L> {

    protected data = new Map<string, MetricDatum<L>>();

    getType() {
        return 'gauge';
    }

    * generateReportLines() {
        for (const datum of this.data.values()) {
            yield [
                this.getMetricLineName(datum.labels),
                datum.value,
                datum.timestamp,
            ].filter(x => x != null).join(' ');
        }
    }

    get(labels: Partial<L> = {}) {
        return this.data.get(this.createMetricLabelsKey(labels));
    }

    set(value: number, labels: Partial<L> = {}, timestamp?: number) {
        const key = this.createMetricLabelsKey(labels);
        const datum = this.data.get(key);
        if (datum) {
            datum.value = value;
            datum.timestamp = timestamp;
        } else {
            this.data.set(key, {
                value,
                timestamp,
                labels,
            });
        }
    }

}
