<!-- flexent-methodology:begin -->
# Flexent methodology

This repository follows the Flexent methodology: OOP-first code guidelines for TypeScript, Vue and mesh-ioc. Read what's around you and match it. Never invent a new approach where a local one exists.

These are the always-on rules. The `flexent` skill (installed under `.agents/skills/flexent`) has the full rule set, the reasoning, the conventions and a structure checker. Project-specific rules live in this file's own sections and in project skills, and they win inside the project.

## Always

- **Keep the three kinds of input apart.** State lives in fields, dependencies come from the container (`@dep()` in Node, `dependency(this, X)` in Vite), and arguments are only what the caller decides on each call.
- **Put code where its subject lives.** A class's own steps are its methods, private even when they don't use `this`. Code about an entity, record or format goes to the class that owns it, or to the missing entity you create for it. Only value types (`Box`, `Money`) and generic code (`slug.ts`) get helper modules.
- **Give each class module one class, named after the file** (`PascalCase.ts`), and each directory one role: `managers/`, `controllers/`, `views/`, `components/`, `pages/`, `global/`, `storage/`, domain families (`exporters/`), `schema/`, `helpers/`.
- **Point dependencies down:** apps → framework packages → domain packages → utility packages. Domain packages are framework-free.
- **Keep one source of truth per fact.** A setting has the shape its schema or form produces, and its defaults are declared there once.
- **Decode at the boundary.** Storage, files, the clipboard and HTTP input are `unknown` until a schema decodes them. Past the boundary, trust the types.
- **Copy at boundaries.** Instances deep-copy what they're given and hand out copies (`toData()`).
- **Prefer fewer entities, layers, branches and arguments.** Abstract on the fourth similar call site, not before.
- **Test the public contract.**
- **Read thrown errors as `catch (error: any)`** and `error?.message`.
- **Name methods as verb plus object** (`openNote`, `deleteNote`). `remove` takes an element out of a list, and `delete` destroys an entity.
- **Fix lint errors.** A long-method warning means the method has two jobs.
- **Fix inconsistencies you notice**, or add them to `TODO.md`. When two ways exist, follow the dominant one.
- **Run `tsc -b`, the linter and the package tests before reporting done.**

## Never

- **Never mix top-level functions and classes in one module.**
- **Never write a static** other than `create` and `decode`, except in an `XCatalog` registry. A static-only class is a missing entity: give it state, don't turn it into helpers.
- **Never write a one-method class with no fields.** A class needs state, collaborators or a lifecycle.
- **Never move a private method out of its class, or make it public, so a test can reach it.**
- **Never write a helper whose subject the app owns.** `order-items.ts`, `user-info.ts` and `cart-utils.ts` name their owner: the code goes there.
- **Never read collaborators from a static, a module global or `process.env` in place.**
- **Never mirror a fact in a second shape, or restate its defaults.**
- **Never write defensive guards against your own contracts**, or speculative features, flags and options.
- **Never fake English with Of/For names** (`idsOf`, `pathFor`). Name the value.
- **Never collapse multi-key object literals onto one line.**
- **Never use `<script setup>` or composables.** Use the Vue Options API.
- **Never introduce a third way of doing something.**
- **Never commit unless asked.** Use Conventional Commits (`type: short summary`).

## When

- **When three or more classes share state bound to one lifecycle instance** (request, connection, session, spawned process), use a scope: a `<Unit>Scope extends Mesh`, registered with `mesh.scope()` and created through an injected `@scope()` provider. Otherwise keep a plain object, a field on the owner, or an instance the owner connects with `mesh.connect`.
- **When frontend logic needs state**, put it in a class: an app-scoped `@provide`d manager, or a controller a manager creates with `mesh.connect`. Views inject managers and never construct controllers. Components use props and events only. Pages are thin.
- **When one action touches several managers**, a coordinating manager sequences them. Managers never watch each other.
- **When a library is heavy**, load it lazily and store its instances with `markRaw`. Never persist them.
- **When every caller re-checks the same preconditions**, move the check into the producer.
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
- `@flexent/protocomm-http` (`packages/protocomm-http`): HTTP handler for Protocomm protocols.
- `@flexent/protocomm-ws` (`packages/protocomm-ws`): WebSocket handler for Protocomm protocols.
- `@flexent/repo-tools` (`packages/repo-tools`): Workspace release scripts: version bumps and publish lists.
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
