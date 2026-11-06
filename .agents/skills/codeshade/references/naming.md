# Naming

Names are short, conventional and honest. An awkward name is the earliest signal of a design problem.

## Rules

- Use two or three words. Don't encode options in names (`createProjectWithDefaultsAndSave`).
- Methods are verb plus object: `openProject`, `listEntries`, `deleteProject`. A bare `get`, `list` or `open` is only acceptable on a class so narrow that nothing else could be meant.
- Use `remove` to take an element out of a collection (add/remove). Use `delete` to destroy an entity.
- Don't fake English with prepositions: `idsOf`, `pathFor`, `valueOfX`. Name the value instead: `projectIds`, `filePath`.
- Getters are nouns (`active`, `frames`, `lastFrame`). Boolean getters read as questions (`isSaved`, `hasReachedObjectLimit`).
- Use the domain's terminology consistently: if the form calls it `splitDistance`, so does the code, the YAML and the UI.

## Suffixes

| Suffix | Meaning |
|--------|---------|
| `XManager` | App-scoped frontend service |
| `XController` | View-scoped frontend state |
| `XService` | App-scoped backend service |
| `XStorage` | Persistence for one entity |
| `XScene` | Three.js `SceneSetup` |
| `XView` | IoC-aware Vue view |
| `XForm` | Form definition constant; `XSpec` is its inferred value |
| `XSchema` | Airtight schema constant |
| `XCatalog` | Static registry of kinds |
| `XGenerator`, `XObject`, `XPush`, … | Members of a domain family. One suffix per directory. |

## Files and identifiers

- Class and definition modules are `PascalCase.ts`. Helper modules are `kebab-case.ts`.
- Vue components are `PascalCase.vue`. Sub-element classes are plain `PascalCase` (`.Heading`, `.Body`), and modifiers are `Component-modifier` (`.Studio-static`).
- CSS variables local to a component are prefixed with it: `--TexturePreview-tile`.
- Persisted keys are dotted and namespaced by app: `growform.ring-growth.projects`, `workbench.textures/voronoi.spec`.
- Form ids are kebab-case and namespaced: `growform-ring-growth-project`.
