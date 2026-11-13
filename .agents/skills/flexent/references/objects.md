# Objects

The methodology is OOP-first and IoC-wired. This page is the working core of both: where behavior goes, what earns a class, and why statics don't count as either.

## Where behavior goes

Walk down this list and stop at the first row that fits.

| The function… | Home |
|---|---|
| reads or changes one object's data | an instance method on that object |
| needs collaborators (config, storage, a logger, another service) | an instance that gets them from the container, even with one method |
| is one of several functions passing the same values around | a **missing entity**: the values become its fields, the functions its methods |
| is pure computation over plain values, and nothing above fits | a helper in `helpers/` (or the `util` package when generic) |

Two answers are never on the list:

- **A `static` method.** It looks like a home and isn't one (see [Why not statics](#why-not-statics)).
- **A one-method class with no fields.** That is a function in a costume. `*Calculator`, `*Processor` and `*Util` classes with no state are the usual suspects.

## What earns a class

A class needs at least one reason to exist:

- **State it owns:** fields that outlive one call, read and changed by its methods.
- **Collaborators:** dependencies injected with `@dep()` (Node) or `dependency(this, X)` (Vite). They're configured once and used on every call, so they count as state.
- **A lifecycle:** it's created, used and disposed, or it's bound to a [scope](./backend.md#scopes).

Behavior alone is not a reason. "Fewer entities" still holds: a missing entity is one the code already implies, not one you invent.

### Spotting a missing entity

The tell is a **data clump**: the same two or three values threaded through several calls, or statics that all take the same first parameter.

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

## Why not statics

A static method belongs to the module, not to any object, so it sits outside everything the container gives you.

- **No IoC.** A caller of `Foo.bar()` is bound to that class forever. Nothing can bind a different implementation, a fake or a decorator.
- **No isolated worlds.** A `Mesh` with its bound instances is a complete world: a test builds a fresh one with fakes, and a scope builds one per request, connection or session. Statics, and static state above all, are shared by every world at once.
- **No extensibility.** A subclass overrides instance methods. It can't usefully override a static that callers name by class.
- **Hidden entities.** A static has no `this`, so its data has to arrive as arguments. That trains code to pass data around instead of asking who owns it, and the missing entity never gets named.

### What static is for

- **Named constructors:** `create` and `decode`, the two ways to make an instance (see [State](./state.md)).
- **Catalogs:** an `XCatalog` maps a kind to its class or loader. It is the one sanctioned static-only class.

Constants go next to the class as module constants (`SLOTTED_TRAY_MAX_SLOTS`), not as static fields. The `flexent/static-members` lint rule enforces all of this.

## Helpers are the last resort

`helpers/` is the one place for code that hasn't found its owner yet. Keeping it there bounds the mess: it stays visible in one directory instead of spreading across class modules as statics and stray methods.

- Reach for a helper only after the table above found no owner.
- Add to an existing helper module when one covers the topic. Otherwise create a new kebab-case module named after the topic (`helpers/angles.ts`), not after the caller.
- Helpers are pure: values in, values out. A "helper" that needs collaborators or keeps state is a class waiting to be named, so name it.
- Helpers get revisited. As the code grows, some of them find their owner (see [Refactoring helpers](../SKILL.md#workflow-refactoring-helpers)).
