import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export const typescriptRules = {
    '@stylistic/arrow-parens': ['error', 'as-needed'],
    '@stylistic/comma-dangle': 'off',
    '@stylistic/indent': ['error', 4, { ignoredNodes: ['PropertyDefinition[decorators]', 'TSUnionType', 'TSIntersectionType', 'TSConditionalType', 'TSTypeReference', 'Decorator'], SwitchCase: 1, FunctionExpression: { parameters: 'off' } }],
    '@stylistic/no-floating-decimal': 'off',
    '@stylistic/operator-linebreak': ['error', 'after'],
    '@stylistic/padded-blocks': ['error', { blocks: 'never', classes: 'always', switches: 'never' }],
    '@stylistic/yield-star-spacing': ['error', 'after'],
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/class-literal-property-style': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'curly': ['error', 'all'],
    'eol-last': 'error',
    'eqeqeq': ['error', 'always', { null: 'never' }],
    'indent': 'off',
    'no-console': ['error', { 'allow': ['warn', 'info', 'error'] }],
    'no-empty': ['error', { allowEmptyCatch: true }],
};

export const javascriptRules = {
    '@typescript-eslint/no-require-imports': 'off',
};

export const sharedConfigs = [
    // Global ignores
    {
        ignores: [
            '**/out',
            '**/dist',
            '**/.*',
        ],
    },

    // Recommended
    eslint.configs.recommended,
    ...typescriptEslint.configs.recommended,
    ...typescriptEslint.configs.stylistic,

    // Stylistic
    stylistic.configs.customize({
        braceStyle: '1tbs',
        indent: 4,
        quoteProps: 'consistent',
        quotes: 'single',
        semi: true,
    }),

    // Sorted imports
    {
        plugins: {
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
        },
    },
    // Unused imports
    {
        plugins: {
            'unused-imports': unusedImports,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
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
            ]
        }
    },

    // TypeScript Overrides
    {
        rules: typescriptRules,
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },

    // Plain JS Overrides
    {
        files: ['**/*.js', '**/*.cjs'],
        rules: javascriptRules,
    },

    // Test overrides
    {
        files: ['**/*.test.ts'],
        rules: {
            // To allow Mocha paddings that improve test readability
            '@stylistic/padded-blocks': 'off',
            'no-restricted-properties': [
                'error',
                {
                    'object': 'describe',
                    'property': 'only'
                },
                {
                    'object': 'context',
                    'property': 'only'
                },
                {
                    'object': 'it',
                    'property': 'only'
                }
            ]
        },
    },

];