# Backend

The backend runs on `@flexent/stack-backend` and mesh-ioc. The same structure works on Node (with Postgres) and on Cloudflare Workers (with D1).

## Composition

`App.ts` is the composition root. It binds app-scoped services in its constructor and registers the [scopes](./ioc.md#scopes) the app creates. Services declare dependencies with `@dep()` (see [IoC](./ioc.md) for keys, bindings and injection).

```ts
export class App extends BaseApp {

    @dep() private pg!: PostgresDb;

    constructor() {
        super();
        this.mesh.service(PostgresDb);
        this.mesh.service(OrderStorage);
        this.mesh.alias(EventProducer, PostgresEventProducer);
        this.mesh.scope(ImportScope);
    }

}
```

Directory roles for backends are in [Conventions](./conventions.md#directories): `global/`, `scoped/`, unit directories, `storage/`, `schema/`, `domains/`, `events/`, `helpers/`.

## Contracts

- Every request body and every row read back from storage is decoded by a schema.
- Authorization happens once, in the scoped auth context. Downstream services trust the principal they're handed.
- Entity schemas use `T | null` for absent persisted fields. Update specs use `field?: T`, plus `| null` only to clear a nullable field.
- Errors are `@flexent/errors` classes with a status.

## Storage

- One `XStorage` class per entity. It owns the entity's table or collection, its queries and its record-to-entity conversion.
- Query building for an entity is part of its storage, or of a query entity the storage owns, never a helper module shared by several storages.

## Protocols

Shared request and response shapes live in a `proto` package (for example `@acme/proto`): domain interfaces and schemas, imported by both the server and the frontend. The server implements them, and the frontend gets a typed client.
