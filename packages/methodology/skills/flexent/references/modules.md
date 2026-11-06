# Modules

Every module is exactly one of a few kinds. Each directory holds modules of a single kind and a single role.

## Module kinds

| Kind | File name | Exports | Example |
|------|-----------|---------|---------|
| Class module | `PascalCase.ts`, named after its class | one class, plus the types and constants it owns | `objects/SlottedTrayObject.ts` |
| Definition module | `PascalCase.ts`, named after its export | a schema or form constant, plus its inferred type | `forms/RingGrowthForm.ts` |
| Helper module | `kebab-case.ts`, concise | related top-level functions | `helpers/growth-groups.ts`, `math/clamp.ts` |
| Type module | `types.ts` (or any lowercase module with no functions or classes) | interfaces, type aliases, constants | `scene-host/src/types.ts` |
| Errors module | `errors.ts` | small error classes | `protocomm/src/main/errors.ts` |
| Entry point | `main.ts`, `entrypoint.ts`, `cli.ts` | bootstrapping | `ensemble/src/main/cli.ts` |
| Barrel | `index.ts` | `export *` re-exports, nothing else | `growform/src/main/index.ts` |
| Vue component | `PascalCase.vue` | one component | `views/StudioView.vue` |

### Class modules

- Never define top-level functions in a class module. A function either becomes a method (`private` or `static`) or moves to a helper module.
- Constants and types that belong to the class may sit next to it: `SLOTTED_TRAY_MAX_SLOTS`, `interface SlottedTrayGeneratorSpec`.
- A domain class may sit with its form when the form is only consumed through that class: `effects/RadialPush.ts` exports `RadialPushForm`, `RadialPushSpec` and `RadialPush`. The same goes for an `objects/*Object.ts` family that pairs a form with a generator.
- A small static-only class is the right home for a registry or catalog: `EffectCatalog`, `ProjectCatalog`, `WorkbenchCatalog`. Don't use an object literal of functions for this.

### Helper modules

- Pure functions with no hidden state.
- Generic ones go to the `util` package. Domain-specific ones go to a `helpers/` (or a role-named, kebab-case, function-only directory such as `geometry/` or `math/`) inside their package.
- Do not create a helper module to park a single function. First look for the class that owns the behavior, or for an existing helper that already does that job.

## Directory roles

A directory is named after the role of its modules, and only modules of that role go in it.

| Directory | Holds | Kind |
|-----------|-------|------|
| `managers/` | App-scoped frontend services (`@provide`) | class |
| `controllers/` | Per-instance frontend state, created by a manager with `mesh.connect` | class |
| `scenes/` | Three.js `SceneSetup`s, loaded lazily | class |
| `views/` | IoC-aware Vue components | vue |
| `components/` | Props-and-events Vue components | vue |
| `pages/` | Route files: thin wrappers over a view | vue |
| `objects/`, `generators/`, `effects/`, `growth/`, … | Domain classes of one family | class |
| `forms/`, `schema/` | Definition modules | definition |
| `global/`, `scoped/`, `storage/`, `http/`, `domains/` | Backend services by scope or role | class |
| `helpers/`, `geometry/`, `math/` | Functions | helper |

Two rules follow from this table:

- Never drop a kebab-case helper into a class directory, or a class into a helper directory. Small helper classes inside utility code are a tolerated minority.
- A family that grows past a dozen modules gets subdirectories by family, not by kind: `workbenches/models/`, `workbenches/textures/`.

## Imports and exports

- ESM only. Local imports carry the `.js` extension.
- Imports are sorted (the lint config enforces this): packages, then local imports.
- Packages expose an explicit surface through `index.ts` and `exports` in `package.json`. Subpath exports such as `@acme/util/dom` are fine for browser-only helpers.
- A module that only uses a lazily loaded class as a type may import it normally: TypeScript and esbuild drop imports used only as types. Never use a lazy module's values outside its chunk.

## Package layout

```
packages/<name>/
    package.json
    tsconfig.json
    .mocharc.json
    src/
        main/        # source, mirrored to out/main
            index.ts
        test/        # *.test.ts, mirrored to out/test
```

Vue-only packages put their source straight under `src/` (no `main/`), because they're consumed as source by Vite.
