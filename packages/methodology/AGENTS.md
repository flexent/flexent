# Flexent methodology

This repository follows the Flexent methodology: OOP-first code guidelines for TypeScript, Vue and mesh-ioc. Read what's around you and match it. Never invent a new approach where a local one exists.

These are the always-on rules. For the reasoning, patterns, recipes and the structure checker, use the `flexent` skill (installed under `.agents/skills/flexent`).

## Structure

- **Never mix top-level functions and classes in one module.** A class module is `PascalCase.ts`, named after its class. Functions live in kebab-case helper modules (`helpers/`, or the `util` package when generic).
- **One role per directory.** `managers/`, `controllers/`, `scenes/`, `views/`, `components/`, `pages/`, domain family directories (`objects/`, `generators/`, …), `forms/`, `helpers/`. Don't drop a helper into a class directory or a class into a helper directory.
- **Helpers are the last resort.** Find the owning class first. When nothing owns a pure function, it goes to `helpers/`: the one place for code that hasn't found its home yet.
- **Dependencies point down:** apps → framework packages → domain packages → utility packages. Domain packages are framework-free.

## Objects

- **A class needs a reason to exist: state, collaborators or a lifecycle.** Behavior alone isn't one. Never write a one-method class with no fields.
- **Find the owner first.** A function that reads an object's data is a method on that object. Values threaded through several functions are a missing entity: they become its fields.
- **Collaborators come from the container**, never from a static, a module global or `process.env` read in place.
- **Static is for named constructors only** (`create`, `decode`), plus `XCatalog` registries. Statics escape IoC: no test, scope or subclass can replace them.

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
