# Layers

A monorepo has four layers. Dependencies point down only.

```
apps/            shop-site, studio-site, workbench-site, shop-backend
  ↓
framework pkgs   configurator-vue, scene-host, scene-builder, planner
  ↓
domain pkgs      shop, growform, texture-gen, label-editor
  ↓
utility pkgs     util, geometry, simple-curve, configurator, generator-runtime
```

## Utility packages

These are framework-free, domain-free toolkits. Most are function-based (`util`, `geometry`), and some are small class libraries (`simple-curve`, `configurator`). They have no knowledge of products.

## Domain packages

These hold the product's model: classes that hold specs and produce results.

- They are framework-free. No Vue, no DOM, no Three.js, no storage. They run the same in a test, a CLI, and a browser.
- They own their persisted format: data interfaces, schemas or forms, decoding, and migration of old saves.
- They expose polymorphic seams instead of `instanceof` switches. For example, `Project.createPreview()` is implemented by each project kind.

## Framework packages

Reusable UI or rendering infrastructure that knows about Vue or Three.js but not about a specific product: `ConfiguratorForm`, `SceneHost`, `SceneBuilder`.

## Apps

Composition roots. An app wires services in `App.ts`, defines routes, and holds app-specific managers and views. Business rules belong in the domain package. They don't belong in an app's managers, and certainly not in its views.

A CLI is an app too (`growform-cli`). It uses `commands/` plus `services/` and the domain package, never the site.

## Prototypes and workbenches

- A **workbench** is an experiment with one form and one preview. Each lives as a lazy chunk in the shared workbench app (see [Workbench](./recipes/workbench.md)).
- A **prototype** has outgrown a single form: it has a project shelf, a timeline, several views. It gets its own domain package plus its own app (`growform` and `growform-site`).
- Promote by moving: the workbench's classes move into a new domain package, and its view becomes an app. Don't let a workbench sprout managers.
