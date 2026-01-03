# Standard HTTP Server

**Status: alpha. Actively developed, new releases may break things.**

Minimal Http Server, based on [Mesh IoC](https://github.com/MeshIoC/mesh-ioc).

## Highlights

- 🗜 Minimal abstraction over native APIs
- 🧩 Composable handlers
- 📦 Routing and standard handlers included
- ☢️ Heavily opinionated!

## Usage

### Handlers

Application logic is implemented in HTTP handlers.
Each handler deals with its subset of domain and delegates processing to others by calling next().

```ts
export class FooHandler implements HttpHandler {

    async handle(ctx: HttpContext, next: HttpNext) {
        // Call next() to execute the next middleware in chain.
        // Or assign ctx.status and ctx.responseBody to end request processing
    }

}
```

### Chains

Multiple handlers are composed into chains.

Chains are also handlers, so request processing can be hierarchical.

```ts
export class AppHandler extends HttpChain {

    @dep() private foo!: FooHandler;
    @dep() private bar!: BarHandler;
    @dep() private baz!: BarHandler;

    handlers = [
        this.foo,
        this.bar,
        this.baz,
    ];
}
```

### Http Server

Http Server instance is configured with a handler.

If handlers do not rely on per-request state, a global handler can be used:

```ts
export class MainHttpServer extends HttpServer {

    @dep() private appHandler!: AppHandler;

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.appHandler.handle(ctx, next);
    }

}
```

### Request Scope

Most applications would require request-scoped state. For example, `AuthHandler` can establish the identity of the caller (e.g. by reading headers, cookies, parsing JWT, etc) and store this identity in `AuthContext` that is available to other handlers.

In that case, `AuthContext` and all its dependents will be request-scoped (i.e. an instance per every request). Such scoping is facilitated with mesh.

A minimal example:

```ts
// scoped/AuthContext.ts
export class AuthContext {

    principal: User | null = null;

    setPrincipal(user: User) {
        this.user = user;
    }

}
```

```ts
// scoped/AuthHandler.ts
export class AuthHandler implements HttpHandler {

    @dep() private auth!: AuthContext;

    async handle(ctx: HttpContext, next: HttpNext) {
        const authorization = ctx.getRequestHeader('Authorization');
        const user = await this.authorize(authorization);
        this.auth.setPrincipal(user);
        await next();
    }

}
```

```ts
// scoped/AppHandler.ts
export class AppHandler extends HttpChain {

    @dep() private authHandler!: AuthHandler;
    @dep() private fooHandler!: FooHandler;

    handlers = [
        this.authHandler.
        this.fooHandler,
    ];

}
```

```ts
export class MainHttpServer extends HttpServer {

    @dep() private mesh!: Mesh;

    private createHttpScope() {
        // Allow request scoped instances to resolve global ones
        const mesh = new Mesh('Request', this.mesh);
        mesh.service(AuthContext);
        mesh.service(AuthHandler);
        mesh.service(FooHandler);
        return mesh;
    }

    async handle(ctx: HttpContext, next: HttpNext) {
        const scope = this.createRequestScope();
        // Allow request-scoped instances to @dep() private ctx!: HttpContext
        scope.constant(HttpContext, ctx);
        const handler = scope.resolve(AppHandler);
        await handler.handle(ctx, next);
    }

}
```

## Configuration

The following env variables are supported by Http Server by default:

- HTTP_PORT (default: 8080) - port to listen to
- HTTP_ADDRESS (default: '0.0.0.0' }) - bind address
- HTTP_TIMEOUT (default: 300_000 }) - HTTP socket timeout
- HTTP_SHUTDOWN_DELAY (default: 5_000 }) — a sleep before stopping accepting connections (useful for 0-downtime deployments in environments like k8s)
- HTTP_BODY_LIMIT (default: 5 * 1024 * 1024 }) - maximum number of bytes allowed in request body

## API Cheatsheet

### Request

#### Request URL

Request URL is parsed and is available as native `URL` object:

```ts
ctx.url.searchParams;
```

#### Query Params

Use `ctx.url.searchParams` to access query string.

Alternatively, use `ctx.query` which is a [HttpDict](#http-dict).

#### Request Headers

Get request header value:

```ts
const authorization = ctx.getRequestHeader('Authorization');
```

Request headers support multiple values, so are stored as [HttpDict](#http-dict).

```ts
ctx.requestHeaders; // { 'content-type': ['application/json'], ... }
```

#### Request body

Request body needs to be explicitly read.

```ts
const body = await ctx.readRequestBody();
```

The body type is inferred from `Content-Type` header, but can also be explicitly specified.

```ts
const jsonBody = await ctx.readRequestBody('json');
```

The following request body types are supported:

  - `json`
  - `text`
  - `urlencoded`
  - `raw`

### Response

#### Status Code

Assign status code:

```ts
ctx.status = 500;
```

Status can also be read from thrown errors by StandardMiddleware:

```ts
class AccessDeniedError extends Error {
    status = 403;
    override name = this.constructor.name;
}

throw new AccessDeniedError();
```

#### Response Headers

Set response header value:

```ts
ctx.setResponseHeader('X-Powered-By', 'Luminable');
```

Response headers support multiple values, so are stored as [HttpDict](#http-dict).

#### Response body

Set response body:

```ts
ctx.responseBody = {
    foo: 123
};
```

The `Content-Type` and `Content-Length` headers will be inferred if not speicified explicitly.

The following response body types are supported:

  - string (text/plain)
  - JSON (application/json)
  - Buffer (application/x-octet-stream)
  - Stream (piped with chunked encoding by default)

Note: you may wish to set Content-Type explicitly if you're using Buffer or Stream.

### Misc

#### Http Dict

Request/Response Headers and parsed Query String objects support multiple values per key.

In order to provide unified type-safe access to them they are stored as `HttpDict` type,
which is just `Record<string, string[]>`.

Thus expect string arrays when accessing `ctx.requestHeaders`, `ctx.responseHeaders` or `ctx.query`.
Or use `ctx.getRequestHeader`, `ctx.setResponseHeader` and `ctx.url.searchParams` for higher-level APIs.
