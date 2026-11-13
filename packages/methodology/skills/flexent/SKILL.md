---
name: flexent
description: Flexent methodology, the code guidelines for TypeScript, Vue 3 Options API, mesh-ioc and Flexent codebases. Use when writing, refactoring, reviewing or organizing code in a repository whose AGENTS.md or CLAUDE.md mentions the Flexent methodology, or when the user asks to apply it or audit a codebase for code-organization drift. Covers where code goes (objects, IoC, statics, helpers), state ownership and decoding, naming, module kinds, directories and package layers, frontend managers, controllers and views, backend composition, mesh-ioc (service keys, bindings, aliases, injection, scopes), and style.
---

# Flexent methodology

Flexent is a small set of conventions that keeps OOP-first TypeScript codebases coherent. The project's `AGENTS.md` carries the always-on rules. This skill adds the reasoning, the full rule set, the details and a checker.

## References

| Page | What it settles |
|------|-----------------|
| [principles.md](references/principles.md) | The values behind every rule, and how projects extend Flexent |
| [conventions.md](references/conventions.md) | Names, suffixes, module kinds, directories, layers, package layout |
| [rules.md](references/rules.md) | Always, Never, When and When not, plus where code goes |
| [frontend.md](references/frontend.md) | Vue apps: composition, managers, controllers, views, components, reactivity |
| [backend.md](references/backend.md) | Backend composition, contracts, storage, protocols |
| [ioc.md](references/ioc.md) | mesh-ioc: keys, services, constants, aliases, injection, connected instances and scopes |
| [style.md](references/style.md) | Formatting, errors, comments, tests, commits, lint rules |

## Workflow: writing or changing code

1. **Orient.** Read the project `AGENTS.md`, any project skill it points to, and two or three neighbouring modules in the directory you're about to touch. Local precedent wins, and you never introduce a third way.
2. **Place it.** Find the subject of what you're adding and follow [Where code goes](references/rules.md#where-code-goes). Then pick the module kind and directory from [conventions.md](references/conventions.md).
3. **Own the data.** Before writing any state, find its one owner and one shape. Decode untrusted input once, and copy at boundaries ([rules.md](references/rules.md#state)).
4. **Write it in the house style** ([conventions.md](references/conventions.md#names), [style.md](references/style.md)).
5. **Check before you report done:**
   - type-check (`tsc -b`, plus `vue-tsc` for Vue apps),
   - lint (`eslint`), and fix what it reports instead of suppressing it,
   - run the tests of every package you touched,
   - run `node <this-skill>/scripts/check-structure.mjs <dir>` on the directories you touched, and fix findings you introduced.

## Workflow: auditing a codebase

1. Run `scripts/check-structure.mjs` at the repository root to list module-kind and directory-role drift.
2. Read the managers or services and the persisted formats. Look for ownership bugs: two shapes of one fact, hand-written field parsing, live references handed across instances, and mutation inside `computed`.
3. Look for god-classes: a class that is at once a store, a persistence layer, a renderer and an engine.
4. Look for object smells: statics other than `create`/`decode`, data clumps threaded through calls, one-method classes with no fields, collaborators read from globals, and [misplaced helpers](references/rules.md#signs-of-a-misplaced-helper).
5. Report findings ranked by risk. Fix only what was asked, and add the rest to the project's `TODO.md`.

## Workflow: refactoring helpers

Revisit `helpers/` when asked, or when a change touches a helper's callers.

1. List each helper function with its subject and its call sites.
2. Move it by its subject (see [Where code goes](references/rules.md#where-code-goes)):
   - only one class calls it as part of its job: make it a private method on that class;
   - its subject is an entity, record or format of the app: make it a method on the class that owns that thing, or create the missing entity when several helpers share the subject;
   - it's generic and another package needs it: move it to the utility package.
3. Leave value types (`money.ts`, `box.ts`) and generic code where they are.
4. Move tests with the code: a test of a former helper now goes through the owner's public API.
5. Keep behavior identical, run the tests, and delete helper modules that end up empty.

## Picking the right piece

| You need | Use | Reference |
|----------|-----|-----------|
| App-wide frontend state or actions | `@provide('x')` manager, bound in `App.ts` | [frontend.md](references/frontend.md#managers) |
| Several live instances of one stateful frontend thing | Controller, created by a manager with `mesh.connect` | [frontend.md](references/frontend.md#controllers) |
| One backend instance with a few `@dep()`s | Connected instance, owned by a manager | [ioc.md](references/ioc.md#connected-instances) |
| Several classes sharing a request, connection, session or process | `XScope extends Mesh`, created through `@scope()` | [ioc.md](references/ioc.md#scopes) |
| An HTTP or WebSocket backend | `@flexent/stack-backend` | [backend.md](references/backend.md) |
| A registry of kinds | `XCatalog` | [conventions.md](references/conventions.md#module-kinds) |
| Rules or recipes specific to one project | That project's `AGENTS.md` section or project skill | [principles.md](references/principles.md#projects-extend-flexent) |
