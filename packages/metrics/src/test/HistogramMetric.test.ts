import assert from 'assert';

import {
    HistogramMetric
} from '../main/index.js';

describe('HistogramMetric', () => {

    it('compiles a report', () => {
        const histogram = new HistogramMetric('foo', 'Foo help');
        histogram.addSeconds(0.16, { lbl: 'one' });
        histogram.addSeconds(0.15, { lbl: 'one' });
        histogram.addSeconds(0.24, { lbl: 'one' });
        histogram.addSeconds(0.11, { lbl: 'one' });
        histogram.addSeconds(0.55, { lbl: 'one' });

        histogram.addSeconds(0.1, { lbl: 'two' });
        histogram.addSeconds(0.6, { lbl: 'two' });
        histogram.addSeconds(0.9, { lbl: 'two' });
        histogram.addSeconds(1.0, { lbl: 'two' });
        histogram.addSeconds(1.05, { lbl: 'two' });
        histogram.addSeconds(2, { lbl: 'two' });
        histogram.addSeconds(3, { lbl: 'two' });

        assert.strictEqual(histogram.report().trim(), [
            `# HELP foo Foo help`,
            `# TYPE foo histogram`,
            `foo_bucket{lbl="one",le="0.005"} 0`,
            `foo_bucket{lbl="one",le="0.01"} 0`,
            `foo_bucket{lbl="one",le="0.025"} 0`,
            `foo_bucket{lbl="one",le="0.05"} 0`,
            `foo_bucket{lbl="one",le="0.1"} 0`,
            `foo_bucket{lbl="one",le="0.25"} 4`,
            `foo_bucket{lbl="one",le="0.5"} 4`,
            `foo_bucket{lbl="one",le="1"} 5`,
            `foo_bucket{lbl="one",le="2.5"} 5`,
            `foo_bucket{lbl="one",le="5"} 5`,
            `foo_bucket{lbl="one",le="10"} 5`,
            `foo_bucket{lbl="one",le="+Inf"} 5`,
            `foo_sum{lbl="one"} 1.21`,
            `foo_count{lbl="one"} 5`,
            `foo_bucket{lbl="two",le="0.005"} 0`,
            `foo_bucket{lbl="two",le="0.01"} 0`,
            `foo_bucket{lbl="two",le="0.025"} 0`,
            `foo_bucket{lbl="two",le="0.05"} 0`,
            `foo_bucket{lbl="two",le="0.1"} 1`,
            `foo_bucket{lbl="two",le="0.25"} 1`,
            `foo_bucket{lbl="two",le="0.5"} 1`,
            `foo_bucket{lbl="two",le="1"} 4`,
            `foo_bucket{lbl="two",le="2.5"} 6`,
            `foo_bucket{lbl="two",le="5"} 7`,
            `foo_bucket{lbl="two",le="10"} 7`,
            `foo_bucket{lbl="two",le="+Inf"} 7`,
            `foo_sum{lbl="two"} 8.65`,
            `foo_count{lbl="two"} 7`,
        ].join('\n'));
    });

});
