import assert from 'assert';

import { get, set } from '../main/index.js';

describe('object', () => {

    // See https://datatracker.ietf.org/doc/html/rfc6901
    const data = {
        'foo': ['bar', 'baz'],
        '': 0,
        'a/b': 1,
        'c%d': 2,
        'e^f': 3,
        'g|h': 4,
        'i\\j': 5,
        'k"l': 6,
        ' ': 7,
        'm~n': 8
    };

    const expectations = {
        '': data,
        '/foo': ['bar', 'baz'],
        '/foo/0': 'bar',
        '/': 0,
        '/a~1b': 1,
        '/c%d': 2,
        '/e^f': 3,
        '/g|h': 4,
        '/i\\j': 5,
        '/k"l': 6,
        '/ ': 7,
        '/m~0n': 8,
    };

    describe('getValue', () => {

        it('passes JSON pointer getter spec', () => {
            for (const [key, expected] of Object.entries(expectations)) {
                const res = get(data, key);
                assert.deepStrictEqual(res, expected);
            }
        });

        it('gets nested values', () => {
            const obj = {
                foo: {
                    bar: ['one', 'two'],
                },
            };
            assert.deepStrictEqual(get(obj, 'foo'), { bar: ['one', 'two'] });
            assert.deepStrictEqual(get(obj, 'foo.bar'), ['one', 'two']);
            assert.deepStrictEqual(get(obj, 'foo.bar.0'), 'one');
            assert.deepStrictEqual(get(obj, 'foo.bar.1'), 'two');
        });

    });

    describe('setValue', () => {

        it('passes JSON pointer setter spec', () => {
            const keys = Object.keys(expectations).slice(1);
            for (const key of keys) {
                const obj = JSON.parse(JSON.stringify(data));
                set(obj, key, 'new');
                const exp = get(obj, key);
                assert.strictEqual(exp, 'new');
            }
        });

        it('does not modify if key is empty', () => {
            const obj = { foo: { bar: [1, 2] } };
            set(obj, '', 'new');
            assert.deepStrictEqual(obj, { foo: { bar: [1, 2] } });
        });

        it('inserts an empty key if key is /', () => {
            const obj = { foo: { bar: [1, 2] } };
            set(obj, '/', 'new');
            assert.deepStrictEqual(obj, { '': 'new', 'foo': { bar: [1, 2] } });
        });

        it('inserts an array item', () => {
            const obj = { foo: { bar: [1, 2] } };
            set(obj, '/foo/bar/-', 'new');
            assert.deepStrictEqual(obj, { foo: { bar: [1, 2, 'new'] } });
        });

        it('creates an array in the middle', () => {
            const obj = {};
            set(obj, '/foo/-/bar', 'new');
            assert.deepStrictEqual(obj, { foo: [{ bar: 'new' }] });
        });

        it('assigns to existing objects', () => {
            const obj = { foo: { bar: 1 } };
            set(obj, '/foo/baz', 'new');
            assert.deepStrictEqual(obj, { foo: { bar: 1, baz: 'new' } });
        });

        it('creates an array with index', () => {
            const obj = {};
            set(obj, 'foo.items.0.bar', '123');
            assert.deepStrictEqual(obj, { foo: { items: [{ bar: '123' }] } });
        });

    });

});
