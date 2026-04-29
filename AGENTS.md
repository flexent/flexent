# Flexent Agent Rules

Flexent is a frameworkless toolkit built around Object Oriented Programming and Inversion of Control.

## Repository Scope

- Keep modules focused and small.
- Prefer explicit, stable exports.
- Scope each change to the correct package.
- Follow OOP and Dependency Injection (`mesh-ioc`) principles.

## TypeScript Rules

- Keep code simple, readable, and modular.
- Break long lines into smaller statements.
- Keep methods short (target: under 30 lines).
- Do not use blank lines inside method bodies.
- Keep argument counts low; use options objects for many parameters.
- Avoid complex TypeScript type constructs; keep types readable.
- Balance type safety with cognitive overhead; avoid type proliferation.
- Prefer `for...of` for loops.
- Do not use `.reduce()` as looping syntax.
- Do not use `.forEach()`.
- Use `.map()`, `.filter()`, and `.some()` only for simple cases.
- Structure classes as: fields, then getters, then methods.
- In each class-member group, place public members before private members.

## Documentation Rules

- Keep Markdown concise and scannable.
- Use short sections and practical examples.
- Use fenced code blocks with language hints.
- Prefer sentence-style prose over dense paragraph blocks.
- Keep naming and terminology consistent with code and package names.
- Separate Markdown blocks with exactly one blank line.

## Dependency Rules

- Do not add external runtime dependencies unless absolutely necessary.

## Commit Rules

- Do not commit unless explicitly instructed.
- Use Conventional Commits.
- Format: `type: short summary` (lowercase, no trailing period).
- Allowed types: `feat`, `fix`, `docs`, `chore`, `style`, `refactor`, `build`.

## Package Purposes

- `@flexent/errors` (`packages/errors`): Generic error classes with standardized name, message, and status code.
- `@flexent/eslint-config` (`packages/eslint-config`): Flexent ESLint config.
- `@flexent/eslint-config-vue` (`packages/eslint-config-vue`): `vueRules` for `.vue` files, merged with shared rules as `{ ...sharedRules, ...vueRules }`.
- `@flexent/http-router` (`packages/http-router`): Decorator-based routing for HTTP servers.
- `@flexent/http-server` (`packages/http-server`): Idiomatic HTTP server API.
- `@flexent/init-decorator` (`packages/init-decorator`): `@init` decorator for `mesh-ioc`.
- `@flexent/jwt` (`packages/jwt`): JWT signing and verification service.
- `@flexent/logger` (`packages/logger`): Logger API with pluggable formatting and transports.
- `@flexent/metrics` (`packages/metrics`): Metrics collection API.
- `@flexent/pathmatcher` (`packages/pathmatcher`): Pathname matching utilities.
- `@flexent/pointer` (`packages/pointer`): Object get/set via JSON Pointer and dot notation.
- `@flexent/protocomm` (`packages/protocomm`): Transport-agnostic, bi-directional JSON messaging.
- `@flexent/stack-backend` (`packages/stack-backend`): Default backend stack setup.
- `@flexent/stack-vue` (`packages/stack-vue`): Default Vue stack setup.

## Package-Specific Rules

- `@flexent/errors`: Keep class hierarchies simple and understandable.
- `@flexent/eslint-config`: Keep the existing rule groups, do not add more.
- `@flexent/http-router`: Keep decorators aligned with standard HTTP methods and routing conventions.
- `@flexent/http-server`: Keep server integration clean with the DI container.
- `@flexent/jwt`: Keep signing and verification configuration explicit.
- `@flexent/logger`: Keep logger transports easily pluggable.
- `@flexent/metrics`: Design API to fit common observability patterns.
- `@flexent/pathmatcher`: Keep matching logic highly optimized and tested.
- `@flexent/pointer`: Keep pointer logic highly optimized and tested.
- `@flexent/protocomm`: Do not assume any specific transport layer.
- `@flexent/protocomm`: Keep protocol logic highly optimized and tested.

## Completion Checklist

- [ ] Change scope is limited to the intended package(s).
- [ ] OOP and DI constraints are followed.
- [ ] Export surfaces remain explicit and stable.
- [ ] Documentation rules are followed.
- [ ] Runtime dependency policy is respected.
- [ ] Package-specific rules for touched packages are satisfied.
- [ ] Relevant checks have been run (`npm run build` or package-specific scripts).
- [ ] Commit rules are followed when committing is requested.
