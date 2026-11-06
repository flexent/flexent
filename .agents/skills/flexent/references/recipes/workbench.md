# Workbench

A workbench is an experiment: one form, one preview, one export. Each is its own lazy chunk, registered in one catalog and served by one app.

The example is a workbench app for parametric 3D objects (Manifold solids) and textures. The names are illustrative.

## Shape

```
apps/workbench-site/
    managers/WorkbenchManager.ts     # open workbench, spec, presets, export, preview wiring
    workbenches/
        Workbench.ts                 # base: form + spec + syncForm()
        ModelWorkbench.ts            # spec → Manifold solids → STL
        TextureWorkbench.ts          # spec → TextureData → PNG
        WorkbenchCatalog.ts          # the only registry; every entry is a dynamic import
        models/PlainCupWorkbench.ts
        textures/VoronoiTextureWorkbench.ts
        scenery/SandboxWorkbench.ts
    forms/                           # shared form builders (ModelForm, TextureForm, ShapeFormControls)
    scenes/ModelScene.ts             # draws solids; lazy
    views/                           # WorkbenchView, WorkbenchSidebar, ModelPreview, TexturePreview, …
    pages/[group]/[name].vue         # one dynamic route for every workbench
```

## Writing one

```ts
export const PlainCupWorkbenchForm = c.form({
    size: c.group('Size', {
        footprint: ModelForm.footprint([4, 4]),
        height: ModelForm.dimension('Height', 3),
        thickness: ModelForm.thickness('Wall thickness', 0.12),
    }),
}, 'workbench-plain-cup');

export type PlainCupWorkbenchSpec = c.infer<typeof PlainCupWorkbenchForm>;

export class PlainCupWorkbench extends ModelWorkbench<PlainCupWorkbenchSpec> {

    readonly form = PlainCupWorkbenchForm;

    generate() {
        return new PlainCupGenerator(this.spec.size).generate();
    }

}
```

Then add one entry to `WorkbenchCatalog`:

```ts
{
    id: 'models/plain-cup',
    title: 'Plain cup',
    async load() {
        const { PlainCupWorkbench } = await import('./models/PlainCupWorkbench.js');
        return new PlainCupWorkbench();
    },
},
```

That's all there is to it. The manager gives every workbench:

- the spec restored from the last session (`workbench.<id>.spec`),
- named presets (`workbench.<id>.presets`),
- copy and paste as JSON (decoded by the form, so pasted JSON can't break the spec),
- reset to defaults,
- export (`exportFile()`: STL or PNG),
- a debounced preview that drops stale generations.

## Rules

- A workbench holds the current spec and syncs its form controls in `syncForm()`. Persistence belongs to the manager, never to the workbench.
- The manager references workbench classes as types only. Importing one as a value would pull its generator stack into the main bundle.
- Defaults live in the form. If a workbench needs a fixed value, it's a constant in `generate()`, not a hidden control.
- When a workbench needs a second view, a shelf of saved projects, or its own domain package, promote it to a prototype app (see [Studio](./studio.md)).
