import assert from 'assert';

import {
    GaugeMetric
} from '../main/index.js';

describe('GaugeMetric', () => {

    it('sets a new value', () => {
        const gauge = new GaugeMetric('foo', 'Foo help');
        gauge.set(1, { foo: 'one' });
        const datum = gauge.get({ foo: 'one' });
        assert.ok(datum);
        assert.strictEqual(datum?.value, 1);
    });

    it('overwrites a existing value', () => {
        const counter = new GaugeMetric('foo', 'Foo help');
        counter.set(2, { foo: 'one' });
        counter.set(5, { foo: 'one' });
        const datum = counter.get({ foo: 'one' });
        assert.ok(datum);
        assert.strictEqual(datum?.value, 5);
    });

    it('sets without labels', () => {
        const counter = new GaugeMetric('foo', 'Foo help');
        counter.set(5);
        const datum = counter.get();
        assert.ok(datum);
        assert.strictEqual(datum?.value, 5);
    });

    it('compiles a report', () => {
        const counter = new GaugeMetric('foo', 'Foo help');
        counter.set(1, {}, 123123123);
        counter.set(1, { lbl: 'one' }, 123123123);
        counter.set(2, { lbl: 'two' }, 123123123);
        counter.set(3, { lbl: 'three', foo: '1' }, 123123123);
        assert.strictEqual(counter.report().trim(), [
            `# HELP foo Foo help`,
            `# TYPE foo gauge`,
            `foo 1 123123123`,
            `foo{lbl="one"} 1 123123123`,
            `foo{lbl="two"} 2 123123123`,
            `foo{foo="1",lbl="three"} 3 123123123`,
        ].join('\n'));
    });

});
