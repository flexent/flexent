import assert from 'node:assert/strict';
import { once } from 'node:events';
import { PassThrough } from 'node:stream';

import { pipeBidirectional } from '../main/util/pipe.js';

describe('pipeBidirectional', () => {

    it('destroys the peer when the left side ends', async () => {
        const left = new PassThrough();
        const right = new PassThrough();
        pipeBidirectional(left, right);
        left.end();
        await once(right, 'close');
        assert.equal(right.destroyed, true);
    });

    it('destroys the peer when the right side ends', async () => {
        const left = new PassThrough();
        const right = new PassThrough();
        pipeBidirectional(left, right);
        right.end();
        await once(left, 'close');
        assert.equal(left.destroyed, true);
    });

});
