import eslint from '@eslint/js';
import noBlankLinesInBlocks from '@inca/eslint-no-blank-lines-in-blocks';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

import { catchError } from './rules/catch-error.mjs';
import { maxParams } from './rules/max-params.mjs';
import { moduleKind } from './rules/module-kind.mjs';
import { restrictImports } from './rules/restrict-imports.mjs';
import { staticMembers } from './rules/static-members.mjs';

export { restrictImports };

/** Flexent's own rules: the methodology guidelines that ESLint can check. */
export const flexentPlugin = {
    meta: {
        name: '@flexent/eslint-plugin',
    },
    rules: {
        'catch-error': catchError,
        'max-params': maxParams,
        'module-kind': moduleKind,
        'static-members': staticMembers,
    },
};

const STORAGE_MESSAGE = 'Use the storage helper (readStored/writeStored) instead of touching browser storage directly.';
const STORAGE_GLOBALS = ['localStorage', 'sessionStorage'];
const STORAGE_PROPERTIES = ['window', 'globalThis', 'self'].flatMap(object => STORAGE_GLOBALS.map(property => ({
    object,
    property,
    message: STORAGE_MESSAGE,
})));

export const sharedConfigs = [

    // Global ignores
    {
        ignores: [
            '**/node_modules',
            '**/out',
            '**/dist',
            '**/.git',
            '**/.github',
            '**/.dev',
            '**/.cache',
        ],
    },

    // Global language options
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },

    // Recommended
    eslint.configs.recommended,
    ...typescriptEslint.configs.recommended,
    ...typescriptEslint.configs.stylistic,
    importPlugin.flatConfigs.typescript,

    // Stylistic
    stylistic.configs.customize({
        braceStyle: '1tbs',
        indent: 4,
        quoteProps: 'as-needed',
        quotes: 'single',
        semi: true,
    }),

    // TypeScript
    {
        plugins: {
            '@inca/no-blank-lines-in-blocks': noBlankLinesInBlocks,
            'simple-import-sort': simpleImportSort,
            'unused-imports': unusedImports,
            unicorn,
        },
        rules: {
            '@inca/no-blank-lines-in-blocks/no-blank-lines-in-blocks': [
                'error',
                {
                    allowSingleBlankLineBeforeComment: true,
                    enableFix: false,
                },
            ],
            '@stylistic/arrow-parens': ['error', 'as-needed'],
            '@stylistic/comma-dangle': 'off',
            '@stylistic/indent': ['error', 4, {
                ignoredNodes: [
                    'PropertyDefinition[decorators]',
                    'TSUnionType',
                    'TSIntersectionType',
                    'TSConditionalType',
                    'TSTypeReference',
                    'Decorator',
                ],
                SwitchCase: 1,
                FunctionExpression: { parameters: 'off' },
            }],
            '@stylistic/no-floating-decimal': 'off',
            '@stylistic/operator-linebreak': ['error', 'after'],
            '@stylistic/padded-blocks': ['error', { blocks: 'never', classes: 'always', switches: 'never' }],
            '@stylistic/yield-star-spacing': ['error', 'after'],
            '@stylistic/generator-star-spacing': ['error', { before: true, after: false }],
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/class-literal-property-style': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'no-type-imports',
                fixStyle: 'inline-type-imports',
            }],
            curly: ['error', 'all'],
            'eol-last': 'error',
            eqeqeq: ['error', 'always', { null: 'never' }],
            indent: 'off',
            'max-len': ['error', {
                code: 120,
                ignoreUrls: true,
                ignoreTemplateLiterals: true,
                ignorePattern: '^import\\s+',
            }],
            'max-lines-per-function': ['error', { max: 50 }],
            'max-statements': ['error', { max: 50 }],
            'no-console': ['error', { allow: ['warn', 'info', 'error'] }],
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-void': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'TSAsExpression > TSTypeReference > Identifier[name="const"]',
                    message: 'Do not use `as const`.',
                },
                {
                    selector: 'TSSatisfiesExpression',
                    message: 'Do not use `satisfies`.',
                },
            ],
            'import/no-extraneous-dependencies': 'error',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            'unicorn/no-array-for-each': 'error',
            'unicorn/no-array-callback-reference': 'error',
            'unicorn/no-array-reduce': ['error', { allowSimpleOperations: false }],
            'unicorn/no-await-expression-member': 'error',
            // Unused imports
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_err$',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
        },
    },

    // Methodology: module kinds and static members
    {
        files: ['**/*.ts', '**/*.mts'],
        ignores: ['**/*.d.ts', '**/*.test.ts', '**/*.config.ts', '**/test/**'],
        plugins: {
            flexent: flexentPlugin,
        },
        rules: {
            'flexent/module-kind': 'error',
            'flexent/static-members': 'error',
        },
    },

    // Methodology: arguments everywhere, thrown errors in TypeScript; tests included
    {
        plugins: {
            flexent: flexentPlugin,
        },
        rules: {
            'flexent/max-params': 'error',
        },
    },
    {
        files: ['**/*.ts', '**/*.mts'],
        ignores: ['**/*.d.ts'],
        rules: {
            'flexent/catch-error': 'error',
        },
    },

    // Methodology: browser storage goes through one helper module that decodes and never throws
    {
        rules: {
            'no-restricted-globals': ['error', ...STORAGE_GLOBALS.map(name => ({
                name,
                message: STORAGE_MESSAGE,
            }))],
            'no-restricted-properties': ['error', ...STORAGE_PROPERTIES],
        },
    },
    {
        files: ['**/storage.ts', '**/storage.mts'],
        rules: {
            'no-restricted-globals': 'off',
            'no-restricted-properties': 'off',
        },
    },

    // Test overrides
    {
        files: ['**/*.test.ts'],
        rules: {
            // To allow Mocha paddings that improve test readability
            '@inca/no-blank-lines-in-blocks/no-blank-lines-in-blocks': 'off',
            'max-lines-per-function': 'off',
            '@stylistic/padded-blocks': 'off',
            'no-restricted-properties': [
                'error',
                {
                    object: 'describe',
                    property: 'only',
                },
                {
                    object: 'context',
                    property: 'only',
                },
                {
                    object: 'it',
                    property: 'only',
                },
            ],
        },
    },

];
