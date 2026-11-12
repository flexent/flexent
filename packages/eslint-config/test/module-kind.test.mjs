import { RuleTester } from 'eslint';

import { moduleKind } from '../rules/module-kind.mjs';

const ruleTester = new RuleTester();

ruleTester.run('module-kind', moduleKind, {
    valid: [
        {
            filename: 'UserManager.ts',
            code: 'export class UserManager {}',
        },
        {
            filename: 'UserManager.ts',
            code: 'export class UserManager {}\nexport class UserNotFoundError extends Error {}',
        },
        {
            filename: 'HealAgent.agent.ts',
            code: 'export class HealAgent {}',
        },
        {
            filename: 'vec2.ts',
            code: 'export function addVec2() {}',
        },
        {
            filename: 'errors.ts',
            code: 'export class NotFoundError extends Error {}\nexport function isNotFound() {}',
        },
    ],
    invalid: [
        {
            filename: 'UserManager.ts',
            code: 'export class UserManager {}\nexport function formatUser() {}',
            errors: [{ messageId: 'functionInClassModule' }],
        },
        {
            filename: 'UserManager.ts',
            code: 'export class Users {}',
            errors: [{ messageId: 'misnamedModule' }],
        },
        {
            filename: 'Authorization.ts',
            code: 'export class Authorization {}\nexport class OrgAuthorization {}\nexport class JobAuthorization {}',
            errors: [
                { messageId: 'extraClass' },
                { messageId: 'extraClass' },
            ],
        },
        {
            filename: 'Authorization.ts',
            code: 'export class OrgAuthorization {}\nexport class JobAuthorization {}',
            errors: [
                { messageId: 'misnamedModule' },
                { messageId: 'extraClass' },
            ],
        },
        {
            filename: 'HealAgent.agent.ts',
            code: 'export class Healer {}',
            errors: [{ messageId: 'misnamedModule' }],
        },
        {
            filename: 'vec2.ts',
            code: 'export class Vec2 {}',
            errors: [{ messageId: 'classInHelperModule' }],
        },
        {
            filename: 'handleError.ts',
            code: 'export const handleError = () => {};',
            errors: [{ messageId: 'helperName' }],
        },
    ],
});
