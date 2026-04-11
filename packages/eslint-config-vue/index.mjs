export const vueConfigs = [
    {
        files: ['**/*.vue'],
        rules: {
            'vue/attribute-hyphenation': ['error', 'never'],
            'vue/attributes-order': 'error',
            'vue/component-definition-name-casing': ['error', 'PascalCase'],
            'vue/first-attribute-linebreak': 'error',
            'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'never' }],
            'vue/html-closing-bracket-spacing': 'error',
            'vue/html-end-tags': 'error',
            'vue/html-indent': ['error', 4, { alignAttributesVertically: false }],
            'vue/html-self-closing': ['error', { html: { void: 'always' } }],
            'vue/max-attributes-per-line': ['error', { singleline: { max: 6 }, multiline: { max: 1 } }],
            'vue/multi-word-component-names': 'off',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/no-multi-spaces': 'error',
            'vue/no-mutating-props': 'off',
            'vue/no-template-shadow': 'off',
            'vue/no-v-html': 'off',
            'vue/order-in-components': 'error',
            'vue/padding-line-between-blocks': ['error', 'always'],
            'vue/padding-lines-in-component-definition': ['error', { betweenOptions: 'always', withinOption: 'ignore', groupSingleLineProperties: false }],
            'vue/prefer-import-from-vue': 'off',
            'vue/prop-name-casing': 'error',
            'vue/require-default-prop': 'off',
            'vue/require-prop-types': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/v-on-event-hyphenation': ['error', 'never'],
        }
    }
];
