# State

Most hard bugs in UI-heavy prototypes are ownership bugs. One object is reachable from two places, or one fact exists in two shapes. These rules exist to make those bugs impossible to write.

## Data and instances

- **Data** is plain JSON: what gets persisted, exported and sent over the wire. It is described by a schema or a form.
- **Instances** are classes that own data and the behavior on it. For example, `RingGrowthProject` owns its `spec` and its `timeline`.

An instance is created in exactly two ways:

```ts
RingGrowthProject.create(name);   // fresh, from form defaults
RingGrowthProject.decode(raw);    // from persisted data, validated
```

and serialized in exactly one way:

```ts
project.toData();                 // a deep copy, safe to persist or export
```

## Decode at the boundary

Anything from outside the process is `unknown` until a schema decodes it. That includes localStorage, files, clipboard, HTTP bodies, and YAML.

- Use an Airtight `Schema` for structure and the domain form for settings: `Form.decode(raw)` fills defaults, coerces types, enforces ranges, and drops unknown fields.
- Decoding either returns a valid instance or throws with a readable message. Nothing between the two is allowed: no half-valid objects, no `| null` for "it didn't parse".
- Hand-written field-by-field parsing (`typeof x === 'number' ? x : undefined`) is a schema written badly. Write the schema.

## The persisted shape is the form shape

When a form edits a spec, the form value is the spec, and the spec is what gets saved.

```yaml
- id: project-14b6…
  kind: ring-growth
  name: Ring Algae A1
  spec:            # exactly RingGrowthForm's value
    band: { … }
    head: { … }
    grow: { … }
  tracks: [ … ]    # effects carry their own form value in `spec`
```

There are no `formValue()`/`applySetup()` mappers and no flat mirror of nested groups. The view passes `project.spec` to the form and receives a new spec back.

## Migrating old saves

Migration is a separate, isolated step that runs before decoding: `LegacyProject.upgrade(raw, kind)`.

- It only moves fields that were renamed or regrouped. Defaults and dropped fields are left to the schema.
- It is idempotent. Current data passes through untouched.
- Once nothing old remains, delete it.

## Single ownership

- Every instance deep-copies what it is given (`updateSpec` clones) and hands out copies (`toData`). No caller can keep a live reference into another instance's data.
- Collections of instances (a shelf of projects) re-issue duplicate ids on the way in.
- YAML output never uses aliases (`aliasDuplicateObjects: false`). An alias parses back as a shared object.
- Form definitions are module singletons. Their `isVisible` flags are synced by the owning instance (`syncForm()`) whenever its spec changes, never from a Vue `computed`.

## Case study: cross-project bleed

In a growth-simulation prototype, each project existed as a flat `data` object plus a nested form value produced by `formValue()`. Changes were written back by `applySetup()`. Revived projects wrapped the raw parsed YAML in place, and form value objects aliased project internals (`{ band: this.data.band }`). Control visibility was synced inside a `computed`, against a form shared by every project.

The symptoms followed: a project would show another project's values, and an edit would land in a project that wasn't open. The fix wasn't a patch. It was the four rules above: one shape, decoded once, owned by one instance, and copied at every boundary.

## Derived state is raw

Caches and engines derived from data (simulation snapshots, Three.js objects, Manifold solids) are kept out of Vue reactivity with `markRaw` and rebuilt when their source changes. They are never persisted.
