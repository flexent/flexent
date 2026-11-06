# Studio

A studio is a prototype app built around a shelf of saved projects: pick one, edit its spec (and timeline), and watch a live preview.

The example is a growth-simulation prototype called Growform. The names are illustrative, so swap in your own domain.

## Domain package

```
packages/growform/src/main/
    forms/          RingGrowthForm.ts, VesselGrowthForm.ts, TexturedRingForm.ts
    effects/        RadialPush.ts (form + class), …, EffectCatalog.ts
    growth/         GrowthState, GrowthStep, GrowthSimulation (implements ProjectPreview)
    project/        Project, GrowthProject, *Project, GrowthTimeline,
                    ProjectCatalog, ProjectFile, LegacyProject, ProjectCompare
    generate/       GenerateSpec, GeneratePlan, ProjectStl (used by the CLI)
```

- `Project<S>` holds `id`, `name` and `spec`, and exposes `form`, `channels`, `createPreview()`, `duplicate()`, `updateSpec()`, `syncForm()` and `toData()`.
- Each kind implements `static create(name)` and `static decode(raw)`. `ProjectCatalog` maps a kind to its class.
- `ProjectPreview.meshes(frame, channel)` is the single pipeline used by the site preview, site export and CLI export alike, so they can't disagree.

## App

```
apps/growform-site/
    managers/
        ShelfManager.ts      # projects of the open kind, the active one, persistence
        EditorManager.ts     # edits to the active spec and timeline, plus selection
        PreviewManager.ts    # frame, paint channel, shading, stats; owns the raw preview and scene
        StudioManager.ts     # actions that change the active project; sequences the other three
    scenes/StudioScene.ts    # draws meshes; lazy
    views/                   # StudioView, ProjectSidebar, ProjectInspector, GrowthTimeline, PreviewHud, ProjectCompare
    components/ChoiceGroup.vue
    pages/                   # vessel-growth.vue, ring-growth.vue, ring-texture.vue → <StudioView kind="…" />
```

## Flow

```
ProjectSidebar ──studio.openProject(id)──▶ StudioManager
                                            ├─ shelf.activateProject(id)
                                            ├─ editor.resetSelection()   → project.syncForm()
                                            └─ preview.loadProject()     → markRaw(project.createPreview())

ProjectInspector ──editor.updateSpec(spec)──▶ EditorManager
                                               ├─ dirty = project.updateSpec(spec)   (clones, syncs the form)
                                               ├─ shelf.saveShelf()
                                               └─ preview.refresh(dirty)             (drops stale frames, redraws)
```

Every edit returns the first frame it invalidates (`GrowthTimeline.untouched` when nothing changes), so the preview recomputes only what it must.
