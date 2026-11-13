# @flexent/eslint-config

The shared ESLint config for Flexent projects: TypeScript, stylistic rules, import order, and the [methodology](../methodology/README.md) guidelines a linter can check.

## Usage

```js
// eslint.config.mjs
import { restrictImports, sharedConfigs } from '@flexent/eslint-config';
import { vueConfigs } from '@flexent/eslint-config-vue';

export default [
    ...sharedConfigs,
    ...vueConfigs,
    restrictImports({
        files: ['apps/site/{pages,views,components,managers}/**/*.{vue,ts}'],
        packages: ['three', 'manifold-3d'],
        message: 'Import from a lazily loaded module under scenes/.',
    }),
];
```

## Methodology rules

| Rule | What it checks |
|------|----------------|
| `flexent/module-kind` | A `PascalCase.ts` module is a class module: no top-level functions, and one class named after the file (error classes may accompany it). A kebab-case module is a helper module: functions only, no classes. `index`, `types`, `constants`, `errors`, `main`, `entrypoint` and `cli` modules fit anywhere. Tests are exempt. |
| `flexent/static-members` | Static methods and fields are only named constructors: `create` and `decode` by default, or the names in `{ allow: [...] }`. `XCatalog` classes are exempt. Static blocks are never allowed. Tests are exempt. |
| `no-restricted-globals`, `no-restricted-properties` | No direct `localStorage` or `sessionStorage`. Browser storage goes through one `storage.ts` helper module, which is exempt. |
| `restrictImports()` | Keeps heavy runtime packages out of the listed files, so they only arrive through lazy chunks. |
| `vue/component-api-style` (in `@flexent/eslint-config-vue`) | Options API only: no `<script setup>`, no composition API. |
| `vue/no-side-effects-in-computed-properties` (in `@flexent/eslint-config-vue`) | Computed properties never assign. |

The rest of the config enforces house style: four-space indent, single quotes, sorted imports, `curly`, method length (50 lines), no blank lines inside blocks, no `as const` or `satisfies`, and no `.forEach` or `.reduce` loops.
