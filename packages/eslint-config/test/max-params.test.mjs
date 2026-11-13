import { RuleTester } from 'eslint';
import typescriptEslint from 'typescript-eslint';

import { maxParams } from '../rules/max-params.mjs';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: typescriptEslint.parser,
    },
});

ruleTester.run('max-params', maxParams, {
    valid: [
        {
            code: 'function move(x, y, z, w) {}',
        },
        {
            code: 'function move(this: Point, x, y, z, w) {}',
        },
        {
            code: 'class Router { find(@Query("a") a, @Query("b") b, @Query("c") c, @Query("d") d, @Query("e") e) {} }',
        },
        {
            code: 'const move = ({ x, y, z, w, v }) => {}',
        },
    ],
    invalid: [
        {
            code: 'function move(x, y, z, w, v) {}',
            errors: [{ messageId: 'maxParams' }],
        },
        {
            code: 'const move = (x, y, z, w, v) => {}',
            errors: [{ messageId: 'maxParams' }],
        },
        {
            code: 'class Point { constructor(readonly x, readonly y, readonly z, readonly w, readonly v) {} }',
            errors: [{ messageId: 'maxParams' }],
        },
        {
            code: 'abstract class Shape { abstract move(x, y, z, w, v): void; }',
            errors: [{ messageId: 'maxParams' }],
        },
    ],
});
