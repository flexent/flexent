# Backend

The backend runs on `@flexent/stack-backend` and mesh-ioc. The same structure works on Node (with Postgres) and on Cloudflare Workers (with D1).

## Composition

`App.ts` is the composition root. It binds app-scoped services in its constructor and registers the [scopes](#scopes) the app creates. Services declare dependencies with `@dep()`.

```ts
export class App extends BaseApp {

    @dep() private pg!: PostgresDb;

    constructor() {
        super();
        this.mesh.service(PostgresDb);
        this.mesh.service(UserAccountStorage);
        this.mesh.alias(EventProducer, PostgresEventProducer);
    }

}
```

## Connected instances

The lighter option. A manager creates a plain instance with `new`, connects it so its `@dep()` fields resolve from the manager's mesh, and keeps it:

```ts
export class SessionProcessManager {

    @dep() private mesh!: Mesh;

    private processes = new Map<string, SessionProcess>();

    create(sessionId: string) {
        const process = new SessionProcess();
        this.mesh.connect(process);
        this.processes.set(sessionId, process);
        return process;
    }

    async stop(sessionId: string) { … }

}
```

Use it when the instance needs a few dependencies but has no collaborators of its own that share its state. The manager owns creation, storage and teardown. `mesh.connect` also attaches one instance to an existing scope (`scope.connect(agent)`).

## Scopes

Every mesh is a scope. The app mesh is the composition root, and a child mesh holds the services of one instance with its own lifecycle.

### When to use a scope

A scope is a relatively heavy construct. Use one only when several classes (three or more) share state that belongs to one instance with its own lifecycle. One or two classes with per-instance state stay plain objects, or a field on their owner.

The units that justify a scope:

| Unit | Scope | Created by |
|------|-------|------------|
| An HTTP request | `HttpScope` | `HttpServer` |
| A WebSocket client connection | `WsScope` | the WebSocket server |
| A session or lease that outlives a request (a thread run) | `ThreadScope` | the manager that owns the session |
| A spawned process, or a group of processes with its supporting services (one Chrome process, its launcher and its local proxy) | `BrowserInstanceScope` | the pool that owns the process |

Anything else is not a scope: one entity, one DTO, a loop iteration, a helper object.

### Connect or scope?

- One instance that needs `@dep()` and is owned by a manager: `mesh.connect`.
- Several classes sharing state bound to one lifecycle instance: a scope.
- The scope's creator is whoever owns the lifecycle: the server (request, connection), a pool or manager (process, session), or, on the frontend, a manager (see [frontend.md](frontend.md#controllers)).
- Passing `this` (a parent controller) into child constructors is the old form. Prefer a scope.

### Writing a scope

A scope is a class that extends `Mesh`, takes the parent mesh, and binds only the scoped services. It lives next to the unit it scopes (`browser/BrowserInstanceScope.ts`).

```ts
export class BrowserInstanceScope extends Mesh {

    constructor(parent: Mesh) {
        super('BrowserInstance', parent);
        this.service(ChromeLauncher);
        this.service(BrowserRoutingProxy);
        this.service(BrowserInstance);
    }

}
```

Register it in the composition root, and inject the provider into whoever creates it:

```ts
// App.ts
this.mesh.scope(BrowserInstanceScope);

// BrowserInstancePool.ts
@scope(BrowserInstanceScope) private createBrowserInstanceScope!: ScopeProvider<BrowserInstanceScope>;

async createInstance() {
    const scope = this.createBrowserInstanceScope();
    scope.constant(BrowserOptions, this.options);
    const instance = scope.resolve(BrowserInstance);
    await instance.start();
    return instance;
}
```

- When the scope must be overridable, register it under a string key with a factory: `mesh.scope('HttpScope', () => this.createHttpScope())`, injected with `@scope('HttpScope')` (see `BaseApp` and `HttpServer`).
- Bind per-instance inputs as constants right after creating the scope and before resolving anything (`scope.constant(HttpContext, ctx)`). Prefer a class key over a string key.
- Scoped services use `@dep()` like any other. Dependencies point outward only: a scoped service may depend on app services, and an app service never depends on a scoped one.
- The creator owns the scope's root object and its teardown. Scopes have no implicit dispose, so stop the root object (`instance.stop()`) and drop the reference.
- A scope may act as a facade: `this.connect(this)` in the constructor plus `@dep()` fields (`scope.runner`, `scope.state`). Use it when callers need several scoped services at once.

Smells:

- An app-scoped service holding `Map<id, State>` is a missing scope only when several collaborators each need that state. When one service owns the map, the map is fine.
- `new XScope(this.mesh)` from an injected `Mesh` bypasses the composition root. `ThreadScope` (`new ThreadScope(id, this.mesh)`) is the older form; new code uses `@scope()`.
- Several `new Child(this)` + `mesh.connect(...)` calls wiring children through a parent fake a scope. Bind the parent's inputs as constants in a scope, and let the children `@dep()` each other.

## Directory roles

| Directory | Holds |
|-----------|-------|
| `global/` | App-scoped services (`XService`, `XHelper`, remotes) |
| `scoped/` (or `http/`) | Request-scoped services: router, auth context, CORS |
| unit directories (`browser/`, `thread/`) | A long-lived unit, its `<Unit>Scope` and its scoped services |
| `storage/` | Persistence classes, one per entity (`UserAccountStorage`) |
| `schema/` | Airtight schemas and their types, named after the type (`User.ts`) |
| `domains/` | Protocomm domain implementations (`UserAccountDomainImpl`) |
| `events/`, `ws/` | Event producers and consumers, WebSocket wiring |
| `helpers/` | Functions (`sql.ts`, `cookies.ts`) |

## Contracts

- Every request body and every row read back from storage is decoded by a schema.
- Authorization happens once, in the scoped auth context. Downstream services trust the principal they are handed.
- Entity schemas use `T | null` for absent persisted fields. Update specs use `field?: T`, plus `| null` only to clear a nullable field.
- Errors are `@flexent/errors` classes with a status. Read `error?.message` rather than narrowing with `instanceof Error`.

## Protocols

Shared request and response shapes live in a `proto` package (for example `@acme/proto`): domain interfaces and schemas, imported by both the server and the frontend. The server implements them, and the frontend gets a typed client.
