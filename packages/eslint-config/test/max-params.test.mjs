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
            code: 'function move(x, y, z) {}',
        },
        {
            code: 'function move(this: Point, x, y, z) {}',
        },
        {
            code: 'class Router { find(@Query("a") a, @Query("b") b, @Query("c") c, @Query("d") d) {} }',
        },
        {
            code: 'const move = ({ x, y, z, w }) => {}',
        },
    ],
    invalid: [
        {
            code: 'function move(x, y, z, w) {}',
            errors: [{ messageId: 'maxParams' }],
        },
        {
            code: 'const move = (x, y, z, w) => {}',
            errors: [{ messageId: 'maxParams' }],
        },
        {
            code: 'class Point { constructor(readonly x, readonly y, readonly z, readonly w) {} }',
            errors: [{ messageId: 'maxParams' }],
        },
        {
            code: 'abstract class Shape { abstract move(x, y, z, w): void; }',
            errors: [{ messageId: 'maxParams' }],
        },
    ],
});
