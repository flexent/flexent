---
name: flexent
description: Flexent methodology, the code guidelines for TypeScript, Vue 3 Options API, mesh-ioc and Flexent codebases. Use when writing, refactoring, reviewing or organizing code in a repository whose AGENTS.md or CLAUDE.md mentions the Flexent methodology, or when the user asks to apply it or audit a codebase for code-organization drift. Covers module kinds, directory roles, package layers, state ownership and persisted formats, managers, views and components, backend scopes, naming, and the workbench and studio app recipes.
---

# Flexent methodology

The Flexent methodology is a small set of conventions that keeps OOP-first TypeScript codebases coherent. The short form lives in the project's `AGENTS.md`. This skill adds the reasoning, the patterns and a checker.

## Workflow: writing or changing code

1. **Orient.** Read the project `AGENTS.md` and look at two or three neighbouring modules in the directory you're about to touch. Local precedent wins over everything below, and you must never introduce a third way of doing something.
2. **Classify what you're adding**, then put it where that kind of thing lives:
   - Behavior plus state is a **class module** (`PascalCase.ts`) in a directory of its role: `managers/`, `controllers/`, `scenes/`, `storage/`, or a domain family such as `objects/` or `effects/`.
   - Pure math or formatting is a **helper**: a function in an existing kebab-case module under `helpers/` or the utility package. Don't create a new helper module for one function.
   - A schema or form is a **definition module** named after its export (`RingGrowthForm.ts`).
   - UI is a **view** (`views/`, injects managers), a **component** (`components/`, props and events only), or a **page** (`pages/`, thin).
   Details: [references/modules.md](references/modules.md) and [references/layers.md](references/layers.md).
3. **Find the owner of the data** before writing any state. One fact has one shape and one owner. Decode untrusted input once with a schema, deep-copy at boundaries, and keep derived engines `markRaw`. Read [references/state.md](references/state.md) whenever you touch persistence, import or export, forms, or anything shared between instances.
4. **Write it in the house style**: verb-plus-object methods, short methods with no blank lines inside them, multi-line object literals, `catch (error: any)`, no `as const`, no defensive guards against your own contracts. Details: [references/naming.md](references/naming.md) and [references/style.md](references/style.md).
5. **Check before you report done:**
   - type-check (`tsc -b`, plus `vue-tsc` for apps if the project has it),
   - lint (`eslint`), and fix what it reports instead of suppressing it,
   - run the tests of every package you touched,
   - run `node <this-skill>/scripts/check-structure.mjs <dir>` on the directories you touched, and fix findings you introduced.

## Workflow: auditing a codebase

1. Run `scripts/check-structure.mjs` at the repository root to list module-kind and directory-role drift.
2. Read the managers or services and the persisted formats. Look for the four ownership smells from [references/state.md](references/state.md): two shapes of one fact, hand-written field parsing, live references handed across instances, and mutation inside `computed`.
3. Look for god-classes: a class that is at once a scene, a store, a persistence layer and an engine.
4. Report findings ranked by risk. Fix only what was asked, and add the rest to the project's `TODO.md`.

## Picking the right frontend piece

| You need | Use | Reference |
|----------|-----|-----------|
| App-wide state or actions | `@provide('x')` manager, registered in `App.ts` | [frontend.md](references/frontend.md) |
| Several live instances of one stateful thing | Controller, created with `mesh.connect` | [frontend.md](references/frontend.md) |
| Three.js or Manifold rendering | `SceneSetup` in `scenes/`, loaded lazily | [frontend.md](references/frontend.md) |
| A form-plus-preview experiment | Workbench | [recipes/workbench.md](references/recipes/workbench.md) |
| Saved projects, an editor and a live preview | Studio | [recipes/studio.md](references/recipes/studio.md) |
| An HTTP or WebSocket backend | Flexent backend scopes | [backend.md](references/backend.md) |

## Non-negotiables

- Never put top-level functions in a class module, or classes in a helper module.
- One role per directory.
- Dependencies point down: apps → framework packages → domain packages → utility packages. Domain packages stay framework-free.
- Use the Vue Options API only. No `<script setup>`, no composables.
- Views inject managers. They never receive a manager or a "studio" object as a prop.
- Managers never watch each other. A coordinating manager sequences them.
- The persisted shape is the form or schema shape. No mirrors, no mappers, no restated defaults.
- Never commit unless asked.

## Principles

When none of the above settles a question, go back to [references/principles.md](references/principles.md): objects own behavior and functions own math; one source of truth per fact; contracts carry invariants; fewer is better; consistency beats cleverness; fix drift on sight.
