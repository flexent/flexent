import assert from 'assert';

import {
    CounterMetric
} from '../main/index.js';

describe('CounterMetric', () => {

    it('increments an new counter', () => {
        const counter = new CounterMetric('foo', 'Foo help');
        counter.incr(1, { foo: 'one' });
        const datum = counter.get({ foo: 'one' });
        assert.ok(datum);
        assert.strictEqual(datum?.value, 1);
    });

    it('increments an existing counter', () => {
        const counter = new CounterMetric('foo', 'Foo help');
        counter.incr(1, { foo: 'one' });
        counter.incr(1, { foo: 'one' });
        const datum = counter.get({ foo: 'one' });
        assert.ok(datum);
        assert.strictEqual(datum?.value, 2);
    });

    it('increments without labels', () => {
        const counter = new CounterMetric('foo', 'Foo help');
        counter.incr();
        const datum = counter.get();
        assert.ok(datum);
        assert.strictEqual(datum?.value, 1);
    });

    it('compiles a report', () => {
        const counter = new CounterMetric('foo', 'Foo help');
        counter.incr(1, {}, 123123123);
        counter.incr(1, { lbl: 'one' }, 123123123);
        counter.incr(2, { lbl: 'two' });
        counter.incr(3, { lbl: 'three', foo: '1' }, 123123123);
        assert.strictEqual(counter.report().trim(), [
            `# HELP foo Foo help`,
            `# TYPE foo counter`,
            `foo 1 123123123`,
            `foo{lbl="one"} 1 123123123`,
            `foo{lbl="two"} 2`,
            `foo{foo="1",lbl="three"} 3 123123123`,
        ].join('\n'));
    });

});
