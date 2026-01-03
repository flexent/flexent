import assert from 'node:assert';

import { LogLevel, StructuredLogFormatter } from '../main/index.js';

describe('StructuredLogFormatter', () => {

    const fmt = new StructuredLogFormatter();

    it('formats log entry', () => {
        const entry = fmt.format({
            level: LogLevel.WARN,
            message: 'Hello',
            data: {
                foo: 123,
                error: new CustomError('Boo'),
            },
        });
        const formatted = JSON.parse(entry.message);
        assert.strictEqual(formatted.message, 'Hello');
        assert.strictEqual(formatted.foo, 123);
        assert.strictEqual(formatted.error.name, 'CustomError');
        assert.strictEqual(formatted.error.message, 'Boo');
        assert.strictEqual(formatted.error.status, 400);
        assert.strictEqual(formatted.error.details.foo, 123);
    });

});

class CustomError extends Error {
    override name = this.constructor.name;
    status = 400;
    details = {
        foo: 123,
    };
}
