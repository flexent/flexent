import assert from 'assert';

import { get } from '../main/index.js';

describe('arrays', () => {

    const data = {
        items: [
            {
                name: 'banana',
                price: { value: 100, currency: 'chf' },
                tags: [
                    { text: 'fruit', color: 'yellow' },
                ],
            },
            {
                name: 'orange',
                price: { value: 50, currency: 'chf' },
                tags: [
                    { text: 'fruit', color: 'orange' },
                    { text: 'sale', color: 'red' },
                ],
            },
            {
                name: 'apple',
                price: { value: 70, currency: 'chf' },
                tags: [
                    { text: 'fruit', color: 'green' },
                ],
            },
        ],
    };

    it('applies to each element of the array', () => {
        const val = get(data, 'items.price.value');
        assert.deepStrictEqual(val, [100, 50, 70]);
    });

    it('accesses sub-arrays with wildcard', () => {
        const val = get(data, 'items.*.tags.*.text');
        assert.deepStrictEqual(val, [['fruit'], ['fruit', 'sale'], ['fruit']]);
    });

    it('works with multi-dimension arrays', () => {
        const matrix = [
            [1, 'one', 'un'],
            [2, 'two', 'deux'],
            [3, 'three', 'trois'],
        ];
        const val = get(matrix, '*.1');
        assert.deepStrictEqual(val, ['one', 'two', 'three']);
    });

});
