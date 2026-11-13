# Frontend

Vue 3 with the Options API, your design system for UI, and mesh-ioc for everything that isn't presentation.

## No `<script setup>`, no composables

The Options API keeps components declarative: `props`, `data`, `computed`, `methods`, `watch`. Logic that would become a composable is a class instead: a manager (app-scoped) or a controller (created by a manager). That keeps one programming model from the domain package up to the template.

## App composition

`App.ts` is the composition root, and the only place services are bound:

```ts
export class App extends BaseApp {

    constructor(vue: VueApp) {
        super(vue);
        this.mesh.service(NotesManager);
        this.mesh.service(EditorManager);
        this.mesh.service(SearchManager);
        this.mesh.service(WorkspaceManager);
        this.setupComponents();
    }

}
```

`BaseApp` (from `@flexent/stack-vue`) installs a mesh middleware that makes every instance `reactive`, and `provideAll` exposes every `@provide`d class to Vue.

## Managers

A manager is an app-scoped class that owns one concern.

```ts
@provide('editor')
export class EditorManager {

    private notes = dependency(this, NotesManager);

    draft = '';
    errorMessage: string | null = null;

    saveDraft() { … }

}
```

- Name it `XManager`, and give it a short provide alias (`'editor'`, `'notes'`).
- Use `dependency(this, X)` in Vite apps, since esbuild doesn't emit decorator metadata.
- Public fields are the view model. Views read them directly.
- Methods are verbs. Views call them directly from templates.
- Managers never watch each other. When one action must touch several managers, a coordinating manager sequences them (`WorkspaceManager.openNote` → `notes`, `editor`, `search`).
- Persist preferences with the [storage helper](#storage-helper). Never call `localStorage` with hand-rolled try/catch.

## Controllers

A controller is per-instance state with dependencies, for things that live several at once (one per open upload, chat or document). A manager creates it and connects it to the app mesh, so its `dependency(this, X)` fields reach managers directly:

```ts
@provide('uploads')
export class UploadManager {

    private mesh = dependency(this, Mesh);

    createUploadController(fileId: string) {
        const controller = new UploadController(fileId);
        return this.mesh.connect(controller);
    }

}
```

- Views get controllers from a manager (`this.uploads.createUploadController(id)`) and never construct them. When a controller must outlive the view, the manager keeps it in a `Map` and owns its teardown.
- Use the value `mesh.connect` returns: it's the reactive instance.
- When several classes share one controller's state, the manager creates a [scope](./ioc.md#scopes) for them instead. `BaseApp` keeps meshes raw, so a scope never becomes a reactive proxy.
- A controller that builds subcontrollers with `new XSubController(this)` is faking a scope. Use a scope.
- A self-contained UI library (a canvas, a chart) owns a parentless root mesh (`mesh = new Mesh()` plus `dependency(this, X)` facades), because it has no app mesh to attach to.

## Views, components, partials, pages

| Kind | Directory | Talks to | Example |
|------|-----------|----------|---------|
| Page | `pages/` | the router | `pages/notes/[id].vue` → `<NoteView :id="id" />` |
| View | `views/` | managers via `inject` | `views/NoteSidebar.vue` |
| Component | `components/` | props and events only | `components/TagPicker.vue` |
| Partial | `views/` | managers, and is reused across views | `views/NoteToolbar.vue` |

- Pages stay thin: route metadata plus one view.
- A view never receives a manager as a prop. It injects it.
- A component never injects app services. When it needs data, the view passes it in.
- Prefer the design system's components and tokens over native elements and custom CSS.

## Reactivity

- Managers are reactive by construction. Instances reachable from them become reactive proxies. That's what you want for data.
- Heavy or foreign objects (editors, renderers, chart instances, workers) are stored with `markRaw` and rebuilt when their source changes. They're never persisted.
- Heavy libraries load in lazy chunks. `restrictImports()` from `@flexent/eslint-config` keeps them out of `pages/`, `views/`, `components/` and `managers/`.
- Never mutate state inside a `computed`.
- Key editing components by the identity they edit (`:key="note.id"`), so switching identity remounts them.

## Storage helper

Every app needs this, so it belongs in the utility package (`util/dom`), not in each manager:

```ts
export function readStored<T>(key: string, fallback: T): T {
    try {
        const raw = globalThis.localStorage?.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function writeStored(key: string, value: unknown) {
    try {
        globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
        // Quota or private browsing: the value just doesn't persist.
    }
}
```

The value still has to be decoded by a schema after `readStored`, because browser storage is outside the boundary.
