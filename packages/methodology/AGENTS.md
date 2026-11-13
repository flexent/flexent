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
