# Conventions

How things are named, which kind of module they are, and where they go.

## Names

Names are short, conventional and honest. An awkward name is the earliest signal of a design problem.

- Use two or three words. Don't encode options in names (`createNoteWithDefaultsAndSave`).
- Methods are verb plus object: `openNote`, `listOrders`, `deleteNote`. A bare `get`, `list` or `open` is acceptable only on a class so narrow that nothing else could be meant.
- Use `remove` to take an element out of a collection (add/remove), and `delete` to destroy an entity.
- Don't fake English with prepositions (`idsOf`, `pathFor`, `valueOfX`). Name the value: `noteIds`, `filePath`.
- Getters are nouns (`active`, `items`, `lastItem`). Boolean getters read as questions (`isSaved`, `hasUnreadItems`).
- Use the domain's terminology consistently. If the schema calls it `dueDate`, so do the code, the API and the UI.

### Suffixes

| Suffix | Meaning |
|--------|---------|
| `XManager` | App-scoped frontend service |
| `XController` | Per-instance frontend state, created by a manager |
| `XService` | App-scoped backend service |
| `XStorage` | Persistence for one entity |
| `XScope` | A [scope](./ioc.md#scopes): the services of one lifecycle instance |
| `XView` | IoC-aware Vue view |
| `XSchema` | Schema constant. `XForm` is a form definition, and `XSpec` is its inferred value. |
| `XCatalog` | Static registry of kinds, the only static-only class |
| `XError` | Error class |

Members of one domain family share one suffix per directory (`exporters/CsvExporter.ts`, `exporters/PdfExporter.ts`).

### Files and identifiers

- Class and definition modules are `PascalCase.ts`. Helper modules are `kebab-case.ts`. Vue components are `PascalCase.vue`.
- CSS sub-element classes are plain `PascalCase` (`.Heading`, `.Body`), and modifiers are `Component-modifier` (`.NoteCard-pinned`). CSS variables local to a component carry its name: `--NoteCard-accent`.
- Persisted keys are dotted and namespaced by app: `notes.editor.layout`, `notes.sidebar.width`.

## Module kinds

Every module is exactly one kind.

| Kind | File name | Exports | Example |
|------|-----------|---------|---------|
| Class module | `PascalCase.ts`, named after its class | one class, plus the types and constants it owns | `storage/OrderStorage.ts` |
| Definition module | `PascalCase.ts`, named after its export | a schema or form constant, plus its inferred type | `schema/Order.ts` |
| Helper module | `kebab-case.ts`, named after a value type or a generic concept | the type and the functions on it. One module per type or concept: add to it rather than starting a second. | `helpers/money.ts`, `util/slug.ts` |
| Type module | `types.ts`, or a lowercase module with no functions or classes | interfaces, type aliases, constants | `src/types.ts` |
| Errors module | `errors.ts` | small error classes | `src/main/errors.ts` |
| Entry point | `main.ts`, `entrypoint.ts`, `cli.ts` | bootstrapping | `src/main/cli.ts` |
| Barrel | `index.ts` | `export *` lines, sorted, nothing else | `src/main/index.ts` |
| Vue component | `PascalCase.vue` | one component | `views/NoteEditor.vue` |

- Constants and types that belong to a class sit next to it in its module: `NOTE_TITLE_MAX_LENGTH`, `interface NoteFilter`.
- A domain class may share its module with a schema or form that is only consumed through it: `exporters/CsvExporter.ts` exports `CsvExporterForm`, `CsvExporterSpec` and `CsvExporter`.
- A registry of kinds is a small static-only `XCatalog` class (`ExporterCatalog`), never an object literal of functions.
- Siblings import each other directly, not through their own barrel.

## Directories

A directory is named after the role of its modules, and holds only modules of that role.

| Directory | Holds | Kind |
|-----------|-------|------|
| `managers/` | App-scoped frontend services (`@provide`) | class |
| `controllers/` | Per-instance frontend state, created by a manager | class |
| `views/` | IoC-aware Vue components | vue |
| `components/` | Props-and-events Vue components | vue |
| `pages/` | Route files: thin wrappers over a view | vue |
| `global/` | App-scoped backend services and remote clients | class |
| `scoped/` (or `http/`) | Request-scoped backend services: router, auth context | class |
| unit directories (`imports/`, `workers/`) | A long-lived unit, its `XScope` and its scoped services | class |
| `storage/` | Persistence classes, one per entity | class |
| `domains/` | Protocol domain implementations (`OrderDomainImpl`) | class |
| `events/`, `ws/` | Event producers and consumers, WebSocket wiring | class |
| domain families (`exporters/`, `providers/`) | Domain classes of one family | class |
| `schema/`, `forms/` | Definition modules | definition |
| `helpers/`, or function-only directories such as `geometry/` or `math/` | Helper modules | helper |

- Never put a helper module in a class directory or a class module in a helper directory. Small helper classes inside utility code are a tolerated minority.
- A family that grows past a dozen modules gets subdirectories by family, not by kind: `exporters/documents/`, `exporters/images/`.

## Layers

A monorepo has four layers, and dependencies point down only:

```
apps/                 web, admin, api, cli
  ↓
framework packages    UI kits, server stacks, editor hosts: Vue or Node aware, product-agnostic
  ↓
domain packages       the product's model
  ↓
utility packages      util and other domain-free toolkits
```

- **Utility packages** know nothing of products. Most are function-based, some are small class libraries.
- **Domain packages** hold the product's model: classes that own data and produce results. They're framework-free (no Vue, no DOM, no HTTP, no storage), so they run the same in a test, a CLI and a browser. They own their persisted formats: schemas, decoding and migration of old data. They expose polymorphic seams (`Exporter.export()`, implemented by each kind) instead of `instanceof` switches.
- **Framework packages** are reusable infrastructure that knows Vue or the server stack but no specific product.
- **Apps** are composition roots: they wire services in `App.ts`, define routes or endpoints, and hold app-specific managers, services and views. Business rules belong in the domain package, never in an app's managers or views. A CLI is an app too: `commands/` plus `services/`.

## Packages

```
packages/<name>/
    package.json
    tsconfig.json
    .mocharc.json
    src/
        main/        # source, compiled to out/main
            index.ts
        test/        # *.test.ts, compiled to out/test
```

- Vue-only packages put their source straight under `src/` (no `main/`), because Vite consumes them as source.
- ESM only. Local imports carry the `.js` extension, and imports are sorted: packages, then local modules.
- A package exposes an explicit surface through `index.ts` and `exports` in `package.json`. Subpath exports (`@acme/util/dom`) are fine for browser-only code.
