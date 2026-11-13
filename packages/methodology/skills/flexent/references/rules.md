# Rules

Rules come in four kinds:

- **Always** and **Never** are hard rules. They hold everywhere. A project overrides one only in its own `AGENTS.md`, and says so.
- **When** and **When not** are conditional rules. They apply when their trigger holds, and they decide most design questions.

[Principles](./principles.md) explain why. [Conventions](./conventions.md) cover names and directories. [Frontend](./frontend.md), [Backend](./backend.md), [IoC](./ioc.md) and [Style](./style.md) go into detail.

## Always

### Structure

- **Give each class module one class, named after the file** (`PascalCase.ts`), and each directory one role (see [Directories](./conventions.md#directories)).
- **Point dependencies down:** apps → framework packages → domain packages → utility packages.

### Behavior

- **Keep the three kinds of input apart.** State lives in fields, dependencies come from the container, and arguments are only what the caller decides on each call (see [Objects own behavior](./principles.md#objects-own-behavior)).
- **Put code where its subject lives** (see [Where code goes](#where-code-goes)).
- **Keep a class's own steps as private methods on it,** whether or not they use `this`.
- **Get collaborators from the container:** `@dep()` in Node, `dependency(this, X)` in Vite apps (see [IoC](./ioc.md#injecting)).
- **Test the public contract.** Construct the object (with `new` or `decode`, or in a test mesh for a service) and check what its public members do.

### State

- **Keep one source of truth per fact.** The persisted shape is the shape its schema or form produces, and defaults are declared once, in that schema or form.
- **Decode at the boundary.** Storage, files, the clipboard, HTTP bodies and YAML are `unknown` until a schema (an Airtight `Schema`, or the domain's form) decodes them. Decoding returns a valid instance or throws a readable error. Past the boundary, trust the types.
- **Make instances in two ways and serialize them in one:** `X.create(…)` from defaults, `X.decode(raw)` from persisted data, and `x.toData()` for a deep copy that's safe to persist or send.
- **Deep-copy what an instance is given, and hand out copies.** Nothing keeps a live reference into another instance's data. A collection re-issues duplicate ids on the way in.
- **Prefer non-nullable fields.** Use `T | null` for a persisted value that can be absent, and `field?: T` for partial updates.

### Code

- **Make contracts carry invariants.** If every caller re-checks the same preconditions, move the check into the producer.
- **Read thrown errors as `catch (error: any)`** and `error?.message`. Use `instanceof` only to match a specific error class.
- **Follow local precedent.** Read two or three neighbouring modules before adding one, and follow the dominant way.
- **Fix lint errors** instead of suppressing them. A long-method warning means the method has two jobs.
- **Fix drift you notice,** or add it to `TODO.md`.
- **Run the type-check (`tsc -b`, plus `vue-tsc` for Vue apps), the linter and the tests of every package you touched** before reporting done.

## Never

### Structure

- **Never mix top-level functions and classes in one module.**
- **Never put a helper module in a class directory, or a class module in a helper directory.**
- **Never let a domain package depend on a framework:** no Vue, no DOM, no HTTP, no storage.

### Behavior

- **Never write a static** other than the named constructors `create` and `decode`, except in an `XCatalog`. Constants are module constants, not static fields.
- **Never turn a static-only class into helper functions.** It's a missing entity: give it state.
- **Never write a one-method class with no fields.** It's a function in a costume.
- **Never move a private method out of its class, or make it public, so a test can reach it.**
- **Never write a helper whose subject the app owns.** Code about an entity, record or format belongs to its owner.
- **Never read collaborators from a static, a module global or `process.env` in place.** Configuration comes through `@config()`. A decorator's registry is the exception (see [When not](#when-not)).
- **Never introduce a third way of doing something.**

### State

- **Never keep a second shape of one fact,** with mappers between the two.
- **Never restate a default** (`DEFAULT_*` copies, `?? fallback` chains, templates).
- **Never hand-write field parsing** (`typeof x === 'number' ? x : undefined`). That's a schema written badly: write the schema.
- **Never return half-valid data,** or `| null` meaning "it didn't parse".
- **Never persist derived state:** caches, engines, and the instances of heavy libraries.
- **Never let a serializer emit aliases or shared references** (YAML: `aliasDuplicateObjects: false`). An alias parses back as one object shared by two owners.

### Code

- **Never write defensive guards against your own contracts.**
- **Never add speculative abstractions, flags or options.**
- **Never fake English with Of/For names** (`idsOf`, `pathFor`).
- **Never type-narrow thrown errors** (`catch (error: unknown)`, `error instanceof Error`, `(error as any)?.message`).
- **Never commit unless asked.**

## When

| When | Do |
|------|----|
| a function's home is in question | find its subject and follow [Where code goes](#where-code-goes) |
| the same two or three values travel through several calls, or several functions take the same first parameter | create the missing entity: the values become its fields, the functions its methods |
| the same raw format is parsed in two places | give the format a class with `decode` and the getters the callers need |
| a class's private step is hard to cover through its public API | split the class if it has two jobs, or give the step its own home if it's a concept of its own |
| a helper is needed by a second package | move it to the utility package; to its own library once other apps want it |
| a class appears that owns a helper's subject | move the helper onto it |
| one instance needs a few dependencies and has an owner | `mesh.connect` it from the owner (see [Connected instances](./ioc.md#connected-instances)) |
| three or more classes share state bound to one lifecycle instance (request, connection, session, spawned process) | create a [scope](./ioc.md#scopes) |
| several instances of a stateful frontend thing live at once | a controller, created by a manager with `mesh.connect` |
| one action must touch several managers | a coordinating manager sequences them |
| persisted data has an old shape | migrate it in a separate, idempotent step before decoding, then delete the step once nothing old remains |
| a library is heavy (an editor, a renderer, a chart engine) | load it in a lazy chunk, store its instances with `markRaw`, and keep it out of pages, views, components and managers with `restrictImports()` |
| a method takes more than four arguments | pass an options object |
| a fourth similar call site appears | abstract, now that the shape is known |
| a family directory grows past a dozen modules | split it into subdirectories by family |
| a registry maps kinds to classes or loaders | an `XCatalog` class |
| a package's consumers need a function API (`defineConfig`) | write one-line facades over the owning class, with no logic of their own |
| a project needs rules of its own | add them to its `AGENTS.md` section or a project skill (see [Projects extend Flexent](./principles.md#projects-extend-flexent)) |

## When not

| Don't | When |
|-------|------|
| create a class | it has no state, no collaborators and no lifecycle |
| create an entity | the code doesn't already imply it. A missing entity is found, not invented. |
| create a scope | fewer than three classes share the state. Keep a plain object, a field on the owner, or a connected instance. |
| extract a helper | only one class calls it. It's a private method. |
| park a function in `helpers/` | its subject already has a class (see [The inbox](#the-inbox)) |
| catch an error | nothing useful happens there: no message shown, no fallback, no data set aside |
| use a bare `get`, `list` or `open` | the class is broad enough that the object isn't obvious |
| use a lazy module's values | you're outside its chunk. Importing it for types only is fine. |
| bind a decorator's registry in the container | decorators run at import time, above every app and mesh, so the registry they fill is a module global (`globalProvideMap` behind `@provide`, `mesh-decorators` behind `@metric`). The mesh reads it later, when it resolves. |

## Where code goes

Find the function's **subject**: the thing it reads, checks, converts or computes. Go down the table and stop at the first row that fits.

| The subject is… | Home |
|---|---|
| a step of the class's own job | a method on that class, `private` unless others call it, whether or not it reads `this` |
| something the app owns: an entity, a record, a DTO, a stored or external format | a method on the class that owns it: the entity's own class, or the storage or service that produces and checks it. If no class owns it yet, create the missing entity. |
| a value type: plain data with no identity, such as `Vec2`, `Box`, `Money` or `DateRange` | a helper module named after the type, holding the type and its functions: `money.ts` exports `Money`, `addMoney` and `formatMoney` |
| a generic concept with no tie to this app, such as slugs, cookies, HMAC or deep equality | the utility package, then its own library once other apps want it |

**Entity or value?** An entity has identity or an owner: something stores it, validates it, exposes it or reads it from outside. That covers an order, a user, a note, an uploaded file and a credentials file pasted by a user. Code about an entity is never a helper, however pure it is. A value type is plain data defined entirely by its contents. It's freely copied and nothing owns it. Domain vocabulary is fine for value types (`DateRange` in a booking app is still a value). When in doubt, ask who would notice if the data were wrong: a storage, a service, a user or an external system means it's an entity.

### The inbox

Sometimes a function's subject really has no owner yet, and creating one would be premature: one function, unsettled boundaries, a term you don't want in the model yet. That function may wait in `helpers/`. Pushing it into a class with a crisp contract, where it doesn't belong, is worse than a visible, temporary helper.

The inbox is never for a subject that already has a class, never for a class's own steps, and never the result of removing statics. Each change that touches an inbox helper's callers asks again whether its owner has shown up.

### Signs of a misplaced helper

- **Its name is a part of something the app owns:** `order-items.ts`, `user-info.ts`, `report-query.ts`, `stripe-auth.ts`. The name already says who owns it.
- **Its name says nothing:** `utils.ts`, `helpers.ts`, `common.ts`, `cart-utils.ts`.
- **Its first parameter is an entity, a record or an instance of an app class:** `toOrderInfo(record)`, `assignNoteTags(note, tags)`.
- **Only one class calls it.**
- **It only forwards or re-exports something else.**
- **It keeps state or needs a collaborator.** Then it's a class waiting to be named.
- **Several helper modules repeat the same constants and shapes** (`clampLimit`, `MAX_*`, `assert*`). They're the same missing entity, once per caller.

## Examples

### A data clump becomes an entity

```ts
// Before: the invoice exists, but nobody owns it
export class PricingManager {

    static computeSubtotal(items: LineItem[]) { … }
    static computeTax(items: LineItem[], region: Region) { … }
    static computeTotal(items: LineItem[], region: Region) { … }

}
```

```ts
// After: the clump is an entity with state and several methods
/** Line items priced for one region. */
export class Invoice {

    private items: LineItem[];

    constructor(items: LineItem[], readonly region: Region) {
        this.items = structuredClone(items);
    }

    get subtotal() { … }

    get tax() { … }

    get total() {
        return this.subtotal + this.tax;
    }

}
```

### An external format becomes an entity

```ts
// Before: helpers/cli-credentials.ts, while another module parses the same file its own way
export function normalizeCredentials(raw: string): string { … }
```

```ts
// After: the file is decoded once, by its own class
/** A `credentials.json` pasted from the vendor's CLI. */
export class CliCredentials {

    static decode(raw: string): CliCredentials { … }

    get hasRefreshToken(): boolean { … }

    toJson(): string { … }

    private findAccountId(): string | null { … }

}
```

### Collaborators come from the container

```ts
// Before: a static that reaches for globals
export class ReportExporter {

    static async exportReport(report: Report) {
        await writeFile(join(process.env.REPORTS_DIR!, report.name), report.render());
    }

}
```

```ts
// After: an instance whose collaborators are bound by the app, a test or a scope
export class ReportExporter {

    @dep() private storage!: ReportStorage;

    async exportReport(report: Report) {
        await this.storage.writeReport(report.name, report.render());
    }

}
```

### Why statics are out

A static belongs to the module, not to any object, so it sits outside everything the container gives you:

- **No IoC.** A caller of `Foo.bar()` is bound to that class forever. Nothing can bind a different implementation, a fake or a decorator.
- **No isolated worlds.** A test builds a fresh mesh with fakes, and a scope builds one per request or session. Statics, and static state above all, are shared by every world at once.
- **No extensibility.** A subclass can't usefully override a static that callers name by class.
- **Hidden entities.** A static has no `this`, so its data arrives as arguments. That trains code to pass data around instead of asking who owns it.

`create` and `decode` are the exception: they're how an instance comes into being. The `flexent/static-members` lint rule enforces this.
