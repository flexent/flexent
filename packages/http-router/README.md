# @luminable/http-router

Decorator-based routing for HTTP server.

## Highlights

- 🎯 Declarative route and parameter definitions
- 🧩 Chain-friendly composition
- ✅ Schema-based parameter validation

## Usage

Define route handlers by decorating async functions with route and parameter decorators.

```ts
export class UsersRouter {

    @dep() private userStorage!: UserStorage;

    @Get({ path: '/users' })
    async getUsers(
        @QueryParam('limit', { schema: { type: 'number', default: 10 } }) limit: number,
        @QueryParam('offset', { schema: { type: 'number', default: 0 } }) offset: number,
    ) {
        const users = await this.userStorage.listUsers(limit, offset);
        return {
            users,
        };
    }

    @Post({ path: '/users' })
    async createUser(
        @BodyParam('name', { schema: { type: 'string' } }) name: string,
        @BodyParam('email', { schema: { type: 'string', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } }) email: string,
        @BodyParam('password', { schema: { type: 'string', minLength: 8 } }) password: string,
    ) {
        const user = await this.userStorage.createUser(name, email, password);
        return { user };
    }

}
```

Bind routes to mesh. Most apps would use a separate scope for isolating request-scoped state.

Also bind `RouterHandler`: it will resolve all routes defined in the same scope. 

```ts
export class HttpScope extends Mesh {

    constructor(parent: Mesh) {
        super('Http', parent);
        this.service(RouteHandler);
        this.service(UsersRouter);
    }

}
```

In HttpServer, instantiate the scope and delegate request handling to RouterHandler.

```ts
export class MainHttpServer extends HttpServer {

    @dep() private mesh!: Mesh;

    async handle(ctx: HttpContext, next: HttpNext) {
        const scope = new HttpScope(this.mesh);
        await scope.resolve(RouteHandler).handle(ctx, next);
    }

}
```

RouteHandler can be part of chain, in that case it is handy to create a dedicated handler:

```ts
export class AppHandler extends HttpChain {

    @dep() private authHandler!: AuthHandler;
    @dep() private errorHandler!: ErrorHandler;
    @dep() private routeHandler!: RouteHandler;

    handlers = [
        this.errorHandler,
        this.authHandler,
        this.routeHandler,
    ];
}
```

Alternatively, each router can inherit from `HttpRouter`.

```ts
export FooRouter extends HttpRouter {

    @Get({ path: '/foo' })
    async getFoo() {
        return {
            foo: 123,
        };
    }

}
```

This way routers can be composed into chains as per usual.

```ts
export class AppHandler extends HttpChain {

    @dep() private authHandler!: AuthHandler;
    @dep() private errorHandler!: ErrorHandler;
    @dep() private fooRouter!: FooRouter;

    handlers = [
        this.errorHandler,
        this.authHandler,
        this.fooRouter,
    ];
}
```
