import eslint from '@eslint/js';
import noBlankLinesInBlocks from '@inca/eslint-no-blank-lines-in-blocks';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export const sharedConfigs = [

    // Global ignores
    {
        ignores: [
            '**/node_modules',
            '**/out',
            '**/dist',
            '**/.*',
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
        quoteProps: 'consistent',
        quotes: 'single',
        semi: true,
    }),

    // TypeScript
    {
        plugins: {
            '@inca/no-blank-lines-in-blocks': noBlankLinesInBlocks,
            'simple-import-sort': simpleImportSort,
            'unused-imports': unusedImports,
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
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/class-literal-property-style': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports',
                fixStyle: 'inline-type-imports',
            }],
            'curly': ['error', 'all'],
            'eol-last': 'error',
            'eqeqeq': ['error', 'always', { null: 'never' }],
            'indent': 'off',
            'max-len': ['error', {
                code: 120,
                ignoreUrls: true,
                ignoreTemplateLiterals: true,
                ignorePattern: '^import\\s+',
            }],
            'max-lines-per-function': ['error', { max: 50 }],
            'max-statements': ['error', { max: 50 }],
            'no-console': ['error', { 'allow': ['warn', 'info', 'error'] }],
            'no-empty': ['error', { allowEmptyCatch: true }],
            'import/no-extraneous-dependencies': 'error',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
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
                    'object': 'describe',
                    'property': 'only',
                },
                {
                    'object': 'context',
                    'property': 'only',
                },
                {
                    'object': 'it',
                    'property': 'only',
                },
            ],
        },
    },

];
