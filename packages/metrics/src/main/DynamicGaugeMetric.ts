import { BaseMetric, type MetricDatum } from './BaseMetric.js';

export class DynamicGaugeMetric<L = any> extends BaseMetric<L> {

    constructor(
        readonly fn: () => Array<MetricDatum<L>>,
        name: string,
        help: string,
    ) {
        super(name, help);
    }

    getType() {
        return 'gauge';
    }

    *generateReportLines() {
        for (const datum of this.fn()) {
            yield [
                this.getMetricLineName(datum.labels),
                datum.value,
                datum.timestamp,
            ].filter(x => x != null).join(' ');
        }
    }

}
