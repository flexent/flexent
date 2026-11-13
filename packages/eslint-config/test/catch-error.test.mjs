import { RuleTester } from 'eslint';
import typescriptEslint from 'typescript-eslint';

import { catchError } from '../rules/catch-error.mjs';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: typescriptEslint.parser,
    },
});

ruleTester.run('catch-error', catchError, {
    valid: [
        {
            code: 'try { run(); } catch (error: any) { log(error?.message); }',
        },
        {
            code: 'try { run(); } catch { fallback(); }',
        },
    ],
    invalid: [
        {
            code: 'try { run(); } catch (error) {}',
            errors: [{ messageId: 'catchError' }],
        },
        {
            code: 'try { run(); } catch (error: unknown) {}',
            errors: [{ messageId: 'catchError' }],
        },
        {
            code: 'try { run(); } catch (err: any) {}',
            errors: [{ messageId: 'catchError' }],
        },
        {
            code: 'try { run(); } catch ({ message }: any) {}',
            errors: [{ messageId: 'catchError' }],
        },
    ],
});
