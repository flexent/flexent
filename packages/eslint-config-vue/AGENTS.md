## Purpose

`@luminable/eslint-config-vue` exports `vueRules` for `.vue` files, omitting any rule key already present on `@luminable/eslint-config`’s `sharedRules`. Consumers combine them with `{ ...sharedRules, ...vueRules }`.

## Shared Repository Guidelines (Required)

All edits in this package must follow the shared repository guidelines in `../../docs/GUIDELINES.md`.

## Do / Don’t

- Do keep `vueRules` in sync with the reference preset when adjusting Vue style.
- Do load `eslint-plugin-vue` in the flat config that applies these rules.
