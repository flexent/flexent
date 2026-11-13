import { RuleTester } from 'eslint';

import { staticMembers } from '../rules/static-members.mjs';

const ruleTester = new RuleTester();

ruleTester.run('static-members', staticMembers, {
    valid: [
        {
            code: 'class Project { static create() {} static decode() {} save() {} }',
        },
        {
            code: 'class EffectCatalog { static kinds = []; static getEffect() {} }',
        },
        {
            code: 'class Project { static fromYaml() {} }',
            options: [{ allow: ['fromYaml'] }],
        },
        {
            code: 'const Project = class { static create() {} }',
        },
    ],
    invalid: [
        {
            code: 'class PricingManager { static computeTotal() {} }',
            errors: [{ messageId: 'staticMethod' }],
        },
        {
            code: 'class Paths { static get root() {} }',
            errors: [{ messageId: 'staticMethod' }],
        },
        {
            code: 'class Formatter { static formatName = () => {} }',
            errors: [{ messageId: 'staticMethod' }],
        },
        {
            code: 'class Registry { static entries = new Map(); static #count = 0 }',
            errors: [
                { messageId: 'staticField' },
                { messageId: 'staticField' },
            ],
        },
        {
            code: 'class Setup { static { this.ready = true; } }',
            errors: [{ messageId: 'staticBlock' }],
        },
        {
            code: 'class Project { static create() {} }',
            options: [{ allow: ['decode'] }],
            errors: [{ messageId: 'staticMethod' }],
        },
        {
            code: 'export default class { static computeTotal() {} }',
            errors: [{ messageId: 'staticMethod' }],
        },
    ],
});
