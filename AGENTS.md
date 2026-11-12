<!-- flexent-methodology:begin -->
# Flexent methodology

This repository follows the Flexent methodology: OOP-first code guidelines for TypeScript, Vue and mesh-ioc. Read what's around you and match it. Never invent a new approach where a local one exists.

These are the always-on rules. For the reasoning, patterns, recipes and the structure checker, use the `flexent` skill (installed under `.agents/skills/flexent`).

## Structure

- **Never mix top-level functions and classes in one module.** A class module is `PascalCase.ts`, named after its class. Functions live in kebab-case helper modules (`helpers/`, or the `util` package when generic).
- **One role per directory.** `managers/`, `controllers/`, `scenes/`, `views/`, `components/`, `pages/`, domain family directories (`objects/`, `generators/`, …), `forms/`, `helpers/`. Don't drop a helper into a class directory or a class into a helper directory.
- **Don't add ad hoc helper modules.** Put the behavior on the class that owns it, or in an existing helper that already does that job. Create a new helper module only when asked.
- **Dependencies point down:** apps → framework packages → domain packages → utility packages. Domain packages are framework-free.

## State

- **One source of truth per fact.** A setting has one shape: the shape its form produces. Don't mirror it, and don't restate its defaults elsewhere.
- **Decode at the boundary.** Storage, files, clipboard and HTTP input are `unknown` until a schema or form decodes them. Past the boundary, trust the types.
- **Single ownership.** Instances deep-copy what they're given and hand out copies (`toData()`). Nothing keeps a live reference into another instance's data.
- **Use scopes sparingly.** Use a scope only when several classes share state bound to one lifecycle instance (request, connection, session, spawned process); otherwise keep it a plain object, a field on the owner, or an instance the owner connects with `mesh.connect`. A scope is a `<Unit>Scope extends Mesh`, registered with `mesh.scope()` and created through an injected `@scope()` provider.
- **Derived engines are raw.** Scenes, simulations and Three.js or Manifold objects are stored with `markRaw` and never persisted.

## Frontend

- Use the Vue Options API. Never use `<script setup>`, and don't write composables.
- Logic lives in classes: app-scoped `@provide`d managers, or controllers a manager creates with `mesh.connect` (views never construct them). In Vite apps, inject with `dependency(this, X)`. In Node, use `@dep()`.
- Views `inject` managers. Components use props and events only. Pages are thin.
- Managers never watch each other. A coordinating manager sequences actions that touch several.
- Three.js and Manifold code lives in lazily loaded `scenes/` (or workbench chunks) and never in pages, views, components or managers.
- Prefer Nightshade components and design tokens over native elements and custom CSS.

## Code

- **Make contracts carry invariants.** If every caller re-checks the same preconditions, move the check into the producer.
- **Don't write excessively defensive code.** No guards against your own contracts.
- **Don't invent accidental complexity.** Prefer fewer entities, layers, flags, branches and arguments. No speculative features.
- **Name methods as verb plus object** (`openProject`, `deleteProject`). `remove` takes an element out of a list; `delete` destroys an entity.
- **Don't fake English with Of/For names** (`idsOf`, `pathFor`). Name the value.
- **Don't type-narrow thrown errors.** Use `catch (error: any)` and read `error?.message`.
- **Never collapse multi-key object literals onto one line.**
- **Always fix lint errors.** A long-method warning means the method has two jobs.
- **Fix inconsistencies you notice**, or add them to `TODO.md`. When two ways exist, follow the dominant one and never add a third.

## Process

- Don't commit unless asked. Use Conventional Commits (`type: short summary`).
- Run `tsc -b`, the linter and the package tests before reporting done.
<!-- flexent-methodology:end -->

## Flexent

Flexent is a frameworkless OOP and IoC toolkit for backend, frontend and CLI apps. Its packages follow the methodology above (`packages/methodology`), and `@flexent/eslint-config` enforces the parts of it that a linter can check.

### Repository rules

- Scope each change to the correct package. Export surfaces stay explicit and stable.
- Don't add external runtime dependencies unless absolutely necessary.
- Keep Markdown concise and scannable, with fenced code blocks that carry language hints.

### Package purposes

- `@flexent/errors` (`packages/errors`): Generic error classes with standardized name, message, and status code.
- `@flexent/ensemble` (`packages/ensemble`): YAML-driven process manager for local development.
- `@flexent/eslint-config` (`packages/eslint-config`): Flexent ESLint config, including the `flexent/module-kind` rule and `restrictImports()` that enforce the methodology.
- `@flexent/eslint-config-vue` (`packages/eslint-config-vue`): `vueRules` for `.vue` files, merged with shared rules as `{ ...sharedRules, ...vueRules }`.
- `@flexent/http-proxy` (`packages/http-proxy`): Modular HTTP/HTTPS proxy components with routing and SSL bumping.
- `@flexent/http-router` (`packages/http-router`): Decorator-based routing for HTTP servers.
- `@flexent/http-server` (`packages/http-server`): Idiomatic HTTP server API.
- `@flexent/init-decorator` (`packages/init-decorator`): `@init` decorator for `mesh-ioc`.
- `@flexent/jwt` (`packages/jwt`): JWT signing and verification service.
- `@flexent/logger` (`packages/logger`): Logger API with pluggable formatting and transports.
- `@flexent/methodology` (`packages/methodology`): Code guidelines for people and agents: always-on rules, the `flexent` Agent Skill, and the `flexent-methodology` installer.
- `@flexent/metrics` (`packages/metrics`): Metrics collection API.
- `@flexent/pathmatcher` (`packages/pathmatcher`): Pathname matching utilities.
- `@flexent/pointer` (`packages/pointer`): Object get/set via JSON Pointer and dot notation.
- `@flexent/protocomm` (`packages/protocomm`): Transport-agnostic, bi-directional JSON messaging.
- `@flexent/stack-backend` (`packages/stack-backend`): Default backend stack setup.
- `@flexent/stack-vue` (`packages/stack-vue`): Default Vue stack setup.
- `@flexent/ws-proxy` (`packages/ws-proxy`): Transparent WebSocket upgrade relay for Node.js HTTP servers.

### Package-specific rules

- `@flexent/errors`: Keep class hierarchies simple and understandable.
- `@flexent/eslint-config`: Keep the existing rule groups. A new rule goes in only when it enforces a methodology guideline, and then into `rules/` with a matching entry in `packages/methodology/skills/flexent/references/style.md`.
- `@flexent/http-proxy`: Keep proxy components modular and transport-focused; prefer hooks over baked-in application logic.
- `@flexent/http-router`: Keep decorators aligned with standard HTTP methods and routing conventions.
- `@flexent/http-server`: Keep server integration clean with the DI container.
- `@flexent/logger`: Keep logger transports and formatters easily pluggable.
- `@flexent/methodology`: `AGENTS.md` is the source of the always-on rules. After editing it, run `npm run rules -w @flexent/methodology` to regenerate `rules/flexent.mdc`. Keep it short; depth goes into `skills/flexent/references/`.
- `@flexent/metrics`: Design API to fit common observability patterns.
- `@flexent/pathmatcher`: Keep matching logic highly optimized and tested.
- `@flexent/pointer`: Keep pointer logic highly optimized and tested.
- `@flexent/protocomm`: Do not assume any specific transport layer.
- `@flexent/protocomm`: Keep protocol logic highly optimized and tested.
- `@flexent/ws-proxy`: Keep relay logic highly optimized and tested.

### Completion checklist

- [ ] Change scope is limited to the intended packages.
- [ ] `npm run lint`, `npm run compile:ts` and the tests of touched packages pass.
- [ ] Export surfaces remain explicit and stable.
- [ ] Package-specific rules for touched packages are satisfied.

### House rules

- Don't test in a browser unless asked. Code, tests, lint and reading the source are enough.
- Always lead with a joke when providing updates. It has to be funny.
