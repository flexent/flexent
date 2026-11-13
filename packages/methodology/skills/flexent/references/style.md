# Style

Most of this is enforced by `@flexent/eslint-config` (plus `@flexent/eslint-config-vue`). Run the linter. If it complains about method length, the method has two jobs, so split it.

Rules that enforce the methodology directly:

- `flexent/module-kind`: class modules have no top-level functions and one class named after the file; helper modules have no classes.
- `flexent/static-members`: static methods and fields are only `create` and `decode` (configurable with `allow`), except in `XCatalog` classes. See [Objects](./objects.md#why-not-statics).
- `no-restricted-globals` and `no-restricted-properties`: no direct `localStorage` or `sessionStorage` outside a `storage.ts` helper.
- `restrictImports({ files, packages, message })`: heavy runtime packages stay out of pages, views, components and managers.
- `vue/component-api-style`: Options API only.
- `vue/no-side-effects-in-computed-properties`: computed properties never assign.

## Code

- Use four-space indentation, single quotes, semicolons, and trailing commas in multiline literals.
- An object literal with more than one property spans several lines, one property per line.
- Order class members as fields, then getters, then methods. Within each group, public comes before private.
- Keep methods short (the lint limit is 50 lines; aim for under 30). Don't leave blank lines inside method bodies.
- Loop with `for…of`. Use `.map`, `.filter` and `.some` only for simple cases. Never use `.forEach`, and never use `.reduce` as a loop.
- No `as const`. Annotate the type instead.
- Use few arguments. Pass an options object once there are more than three.
- Keep types readable. Don't build type-level programs, and don't create a new type for every intermediate value.

## Errors

- Throw early, at the boundary that can explain the problem, with a message a person can act on.
- Use `catch (error: any)` and read `error?.message`. Use `instanceof` only for specific error classes.
- Catch only where something useful happens: show the message, fall back, or set data aside. Never catch just to rethrow.

## Comments

- Write a one-line JSDoc on every class and on any method whose contract isn't obvious from its name.
- Comments explain why or what is guaranteed. They don't narrate what the code does.
- Never leave commented-out code. Delete it, since git remembers.

## Tests

- Domain packages carry Mocha tests in `src/test/*.test.ts`, run from compiled `out/`.
- Test behavior through the public API (`Project.decode`, `updateSpec`, `toData`), not private helpers.
- A refactor of a geometry pipeline should prove byte-identical output against the previous version: hash the STL before and after.

## Commits

- Use Conventional Commits: `type: short summary`, lowercase, no trailing period.
- Allowed types are `feat`, `fix`, `docs`, `chore`, `style`, `refactor` and `build`.
- Agents don't commit unless asked.
