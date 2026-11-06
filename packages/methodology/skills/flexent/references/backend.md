# Backend

The backend runs on `@flexent/stack-backend` and mesh-ioc. The same structure works on Node (with Postgres) and on Cloudflare Workers (with D1).

## Composition

`App.ts` binds app-scoped services in its constructor and creates a child mesh per request (or per connection) in `createHttpScope()`. Services declare dependencies with `@dep()`.

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

## Directory roles

| Directory | Holds |
|-----------|-------|
| `global/` | App-scoped services (`XService`, `XHelper`, remotes) |
| `scoped/` (or `http/`) | Request-scoped services: router, auth context, CORS |
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
