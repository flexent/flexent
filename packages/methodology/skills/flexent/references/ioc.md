# IoC

Every Flexent app is wired by mesh-ioc. A `Mesh` is a container: a map from service keys to bindings, plus the instances it has created from them. `App.ts` builds the app mesh, and a test builds its own mesh with fakes.

## Service keys

- **A key is a string, and a class used as a key stands for its name.** `OrderStorage` and `'OrderStorage'` are the same key. Two classes with the same name collide in one mesh, so keep bound class names unique.
- **An interface can't be a key,** because it doesn't exist at runtime. When callers need a contract with several implementations, make it an abstract class and bind implementations to it: `mesh.service(Mailer, SmtpMailer)`.
- **Don't split a class into an abstract contract and its only implementation.** Bind the concrete class to itself. Add the abstract class when a second implementation (or a fake that must replace it) appears.
- **Prefer class keys.** A string key (`@dep({ key: 'apiUrl' })`) is for a value with no class of its own.

## Bindings

| Binding | Call | Resolves to | Use it for |
|---------|------|-------------|------------|
| Service | `mesh.service(OrderStorage)`, `mesh.service(Mailer, SmtpMailer)` | one instance per mesh, created on first resolve | everything with behavior |
| Constant | `mesh.constant(ImportSource, source)` | the value exactly as given | inputs the container can't construct |
| Alias | `mesh.alias(EventProducer, PostgresEventProducer)` | whatever the other key resolves to: the same instance | one instance under two keys |
| Scope | `mesh.scope(ImportScope)` | a provider that creates child meshes | see [Scopes](#scopes) |

### Services

- **A service has a constructor with no arguments.** Its state lives in its fields and its collaborators come from `@dep()`. A class that needs constructor arguments isn't a service: it's an entity or a connected instance, created with `new`.
- **One instance per mesh.** A service is created on first resolve and cached in the mesh that holds its binding. Bound in the app mesh, it's an app singleton. Bound in a scope, there's one per scope instance.
- **Dependencies resolve lazily**, on first access, so circular dependencies work. Give both sides of a cycle an explicit key (`@dep({ key: 'OrderService' })`), because module load order can leave one inferred type undefined.
- **The mesh is attached before the constructor runs,** so `@dep()` fields work there. Keep constructors light anyway: no I/O, no awaiting.

### Constants

Bind a constant for something the container can't construct:

- the per-instance inputs of a scope, bound right after creating it (`scope.constant(HttpContext, ctx)`);
- values built outside the container: decoded config, an SDK client, process arguments;
- fixtures in a test mesh.

Key a constant by a class whenever there is one, so `@dep()` infers it and the value is type-checked. Never bind a constant for something that could be a service.

### Aliases

An alias redirects one key to another in the same mesh, so both resolve to one instance. Use it in two cases:

- **One implementation answers to two keys.** `mesh.service(PostgresEventProducer)` plus `mesh.alias(EventProducer, PostgresEventProducer)` lets callers depend on either, and both get the same instance. Binding `mesh.service(EventProducer, PostgresEventProducer)` as well as `PostgresEventProducer` would create two.
- **A test replaces a service with a fake it wants to inspect.** `mesh.service(FakeMailer)` plus `mesh.alias(Mailer, FakeMailer)`: the code under test gets the fake through `Mailer`, and the test resolves `FakeMailer` to read what it recorded.

An alias is not a rename, and not a compatibility shim for an old key.

## Injecting

| Runtime | Syntax | Why |
|---------|--------|-----|
| Node (backends, CLIs) | `@dep() private storage!: OrderStorage;` | `emitDecoratorMetadata` lets the key be inferred from the field type, so the type must be a class |
| Vite apps | `private storage = dependency(this, OrderStorage);` | esbuild doesn't emit decorator metadata, so the key is passed explicitly. The result is a lazy proxy. |

Either way, the instance must belong to a mesh: created by it, or attached with `mesh.connect`. Reading a dependency on an unattached instance throws.

- **Every mesh binds itself as `Mesh`.** `@dep() private mesh!: Mesh` is the mesh the instance lives in. A service uses it to `connect` instances it creates, never to `resolve` its own collaborators: those are `@dep()` fields. `resolve` belongs to composition roots and scope creators.
- **Middleware** (`mesh.use(fn)`) transforms every instance as it's attached, parent middleware included. `BaseApp` uses it to make frontend instances reactive. Apps rarely need their own.

## Connected instances

An owner creates a plain instance with `new`, connects it so its `@dep()` fields resolve from the owner's mesh, and keeps it:

```ts
export class ExportJobManager {

    @dep() private mesh!: Mesh;

    private jobs = new Map<string, ExportJob>();

    createJob(jobId: string) {
        const job = this.mesh.connect(new ExportJob(jobId));
        this.jobs.set(jobId, job);
        return job;
    }

    async cancelJob(jobId: string) { … }

}
```

The owner handles creation, storage and teardown. `mesh.connect` also attaches one instance to an existing scope (`scope.connect(job)`). On the frontend, controllers work the same way (see [Controllers](./frontend.md#controllers)).

## Scopes

Every mesh is a scope. The app mesh is the composition root, and a child mesh holds the services of one instance with its own lifecycle. A scope is a relatively heavy construct, so first check whether a connected instance will do.

### Connect or scope?

- **One instance that needs `@dep()` and has an owner:** `mesh.connect`.
- **Several classes (three or more) sharing state bound to one lifecycle instance:** a scope.
- **One or two classes with per-instance state:** a plain object, or a field on their owner.

Anything that isn't a lifecycle instance is never a scope: one entity, one DTO, a loop iteration, a helper object.

### When to use a scope

The units that justify a scope:

| Unit | Scope | Created by |
|------|-------|------------|
| An HTTP request | `HttpScope` | `HttpServer` |
| A WebSocket client connection | `WsScope` | the WebSocket server |
| A session or lease that outlives a request (an editing session, a long import) | `ImportScope` | the manager that owns the session |
| A spawned process, or a group of processes with their supporting services (a worker process, its launcher and its log pipe) | `WorkerProcessScope` | the pool that owns the processes |

The creator is whoever owns the lifecycle: the server (request, connection), a pool or manager (process, session), or, on the frontend, a manager.

### Writing a scope

A scope is a class that extends `Mesh`, takes the parent mesh, and binds only the scoped services. It lives next to the unit it scopes (`imports/ImportScope.ts`).

```ts
export class ImportScope extends Mesh {

    constructor(parent: Mesh) {
        super('Import', parent);
        this.service(ImportReader);
        this.service(ImportValidator);
        this.service(ImportRun);
    }

}
```

Register it in the composition root, and inject the provider into whoever creates it:

```ts
// App.ts
this.mesh.scope(ImportScope);

// ImportManager.ts
@scope(ImportScope) private createImportScope!: ScopeProvider<ImportScope>;

async startImport(source: ImportSource) {
    const scope = this.createImportScope();
    scope.constant(ImportSource, source);
    const run = scope.resolve(ImportRun);
    await run.start();
    return run;
}
```

- When the scope must be overridable, register it under a string key with a factory: `mesh.scope('HttpScope', () => this.createHttpScope())`, injected with `@scope('HttpScope')`.
- The provider takes an optional parent (`this.createImportScope(parentMesh)`). Without one, the scope's parent is the mesh that holds the registration.
- Bind per-instance inputs as constants right after creating the scope and before resolving anything (`scope.constant(HttpContext, ctx)`). Prefer a class key over a string key.
- Scoped services use `@dep()` like any other. Dependencies point outward only: a scoped service may depend on app services, and an app service never depends on a scoped one.
- The creator owns the scope's root object and its teardown. Scopes have no implicit dispose: stop the root object (`run.stop()`) and drop the reference.
- A scope may act as a facade: `this.connect(this)` in the constructor plus `@dep()` fields (`scope.reader`, `scope.run`). Use it when callers need several scoped services at once.

### Smells

- An app-scoped service holding `Map<id, State>` is a missing scope only when several collaborators each need that state. When one service owns the map, the map is fine.
- `new XScope(this.mesh)` from an injected `Mesh` bypasses the composition root. Use `@scope()`.
- Several `new Child(this)` plus `mesh.connect(…)` calls wiring children through a parent fake a scope. Bind the parent's inputs as constants in a scope, and let the children `@dep()` each other.
