import assert from 'assert';

import { get } from '../main/index.js';

describe('null', () => {

    it('returns undefined if any component is missing', () => {
        const val = get({ foo: { bar: { baz: 1 } } }, 'foo.baaaar.baz');
        assert.deepStrictEqual(val, undefined);
    });

    it('array queries handle undefined too', () => {
        const val = get([
            { foo: 1 },
            { bar: 2 },
            { foo: 3 },
        ], 'foo');
        assert.deepStrictEqual(val, [1, undefined, 3]);
    });

});
