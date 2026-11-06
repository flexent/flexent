# Frontend

Vue 3 with the Options API, Nightshade for UI, and mesh-ioc for everything that isn't presentation.

## No `<script setup>`, no composables

The Options API keeps components declarative: `props`, `data`, `computed`, `methods`, `watch`. Logic that would become a composable is a class instead: either a manager (app-scoped) or a controller (view-scoped). That keeps one programming model from the domain package up to the template.

## App composition

`App.ts` is the composition root, and the only place services are bound:

```ts
export class App extends BaseApp {

    constructor(vue: VueApp) {
        super(vue);
        this.mesh.service(SceneManager);
        this.mesh.service(ShelfManager);
        this.mesh.service(PreviewManager);
        this.mesh.service(EditorManager);
        this.mesh.service(StudioManager);
        this.vue.provide('$nightshade', this.nightshade);
        this.setupComponents();
    }

}
```

`BaseApp` (from `@flexent/stack-vue`) installs a mesh middleware that makes every instance `reactive`, and `provideAll` exposes every `@provide`d class to Vue.

## Managers

A manager is an app-scoped class that owns one concern.

```ts
@provide('preview')
export class PreviewManager {

    private shelf = dependency(this, ShelfManager);

    frame = 0;
    errorMessage: string | null = null;

    private preview: ProjectPreview | null = null;

    setFrame(frame: number) { … }

}
```

- Name it `XManager`, and give it a short provide alias (`'preview'`, `'shelf'`).
- Use `dependency(this, X)` for injection in Vite apps, since esbuild does not emit decorator metadata. Use `@dep()` in Node backends and CLIs.
- Public fields are the view model. Views read them directly.
- Methods are verbs. Views call them directly from templates.
- Managers never watch each other. When one action must touch several managers, a coordinating manager sequences them (`StudioManager.openProject` → `shelf`, `editor`, `preview`).
- Persist preferences with a `readStored`/`writeStored` helper in your utility package (see [Storage helper](#storage-helper)). Never call `localStorage` with hand-rolled try/catch.

## Controllers

A controller is view-scoped state with dependencies. Create it with `this.mesh.connect(new XController(args))` from a manager that keeps it alive for as long as needed: for example a `TransactionManager` that holds one `TransactionController` per open operation in a map. Use one when several instances of a thing exist at once. Otherwise a manager is simpler.

## Views, components, partials, pages

| Kind | Directory | Talks to | Example |
|------|-----------|----------|---------|
| Page | `pages/` | the router | `pages/ring-growth.vue` → `<StudioView kind="ring-growth" />` |
| View | `views/` | managers via `inject` | `views/ProjectSidebar.vue` |
| Component | `components/` | props and events only | `components/ChoiceGroup.vue` |
| Partial | `views/` | managers, and is reused across views | `views/WorkbenchPresets.vue` |

- Pages stay thin: route metadata plus one view.
- A view never receives a manager or a "studio" object as a prop. It injects it.
- A component never injects app services. When it needs data, the view passes it in.
- Vue files use Nightshade components (`Btn`, `InputText`, `InputGroup`, `HGroup`, `VGroup`, `ContextMenu`) and tokens (`--sp*`, `--color-*`) before any custom CSS.

## Scenes and lazy chunks

Three.js and Manifold never reach the main bundle.

- A `SceneSetup` subclass lives in `scenes/` and is loaded with `lazySceneSetup(() => import('../scenes/X.js'), 'X')`.
- `SceneHost` emits `ready` with the instance, and a manager keeps it (`markRaw`) and pushes meshes into it.
- A scene draws what it is handed. It never decides what to draw.
- `restrictImports()` from `@flexent/eslint-config` forbids `three`, `manifold-3d` and the scene builder in `pages/`, `views/`, `components/` and `managers/`.

## Reactivity rules

- Managers are reactive by construction. Instances reachable from them, such as projects, become reactive proxies. That's what you want for data.
- Heavy or foreign objects (scenes, simulations, workbench instances, Three.js objects) are stored with `markRaw`.
- Never mutate state inside a `computed`.
- Key form components by the identity they edit (`:key="project.id"`), so switching identity remounts them.

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
        // Quota or private browsing: the value just does not persist.
    }
}
```

The value still has to be decoded by a schema after `readStored`, because localStorage is outside the boundary.
