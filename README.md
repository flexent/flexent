# Luminable — frameworkless application toolkit

Luminable is a toolkit for building scalable applications using the powers of Object Oriented Programming and Inversion of Control.

## Core Principles

- **Frameworkless design.** The cornerstone design principle of Luminable: there is no framework, no single rigid structure that assumes what the application does and forces everything to be done in a specific way.

  The only universal assumption is that applications are structured with classes.

- **Component-based architecture.** Applications are built using **components** — small focused classes, each addressing a specific application concern. Components are registered centrally in IoC container and can be injected into other components as dependencies.

- **Runtime-agnostic.** Luminable is designed for building fundamentally different applications: frontend, backend, CLI, scripts, background tasks, etc. The same OOP/IoC approach works equally well for applications of any kind and nature.

- **Convention-optional.** Luminable recognizes that conventions are useful, but does not enforce them. It ships micro-libraries for addressing specific common concerns (e.g. logging, metrics) and "stack" modules that encapsulate common conventions for a specific runtime (e.g. Node.js backend, Vue frontend, etc). Stack modules are optional: they simply compose existing primitives into a conventional setup and thus can be easily re-created or extended to accommodate specific needs.

## Why?

Luminable is built on decades of experience in building _different_ kinds of applications and observing overarching similarities in how complexity grows and how efficient patterns emerge.

While there is no silver bullet, Luminable embraces universal ideas that have survived the test of time:

- **Separation of concerns.** Each component has a single, clearly defined responsibility, making systems easier to reason about, test and evolve.
- **Design by contract.** Components communicate through explicit interfaces and well-defined expectations rather than implicit runtime behavior.
- **Inversion of control / Dependency injection.** Components are not responsible for instantiating and resolving their dependencies. Instead, they declare what they need and let the container fill in the blanks.

## Examples

> Instead of thousands of words,

The following snippets show you the feel of how your application looks like.

### Node.js Backend

```ts
// src/storage/UserStorage.ts
export class UserStorage {

  @dep() private sql!: SqlClient;

  async listUsers(limit: number, offset: number): Promise<User> {
    const users = await this.sql.query('SELECT * FROM users LIMIT ? OFFSET ?', [limit, offset]);
    return users.map(user => UserSchema.parse(user));
  }

  async createUser(user: User): Promise<void> {
    const newUser = await this.sql.query('INSERT INTO users (id, name, email) VALUES (?, ?, ?)', [user.id, user.name, user.email]);
    return UserSchema.parse(newUser);
  }
}
```

```ts
// src/routes/UserRouter.ts
export class UserRouter {
  
  @dep() private userStorage!: UserStorage;
  
  @Get({ path: '/users' })
  async listUsers(
    @QueryParam('limit', {
      schema: { type: 'number', default: 10 },
    }) limit: number,
    @QueryParam('offset', {
      schema: { type: 'number', default: 0 },
    }) offset: number,
  ) {
    const users = await this.userStorage.listUsers(limit, offset);
    return { users };
  }

  @Post({ path: '/users' })
  async createUser(
    @BodyParam('name', { schema: { type: 'string' } }) name: string,
    @BodyParam('email', { schema: { type: 'string' }) email: string,
  ) {
    const id = randomUUID();
    await this.userStorage.createUser({ id, name, email });
    return { id };
  }

}
```

```ts
// src/App.ts
export class App {

  mesh = new Mesh();

  constructor() {
    this.mesh.service(HttpServer);
    this.mesh.service(UserRouter);
    this.mesh.service(UserStorage);
  }

  async start() {
    await this.mesh.resolve(HttpServer).start();
  }

  async stop() {
    await this.mesh.resolve(HttpServer).stop();
  }
}
```

### Vue 3 Frontend

```ts
// src/App.ts
import { createApp } from 'vue';
import { reactive } from '@vue/reactivity';
import { RootView } from './views/RootView.vue';

export class App {

  mesh = new Mesh();
  vue = createApp(RootView);

  constructor() {
    this.mesh.use(instance => reactive(instance));
    this.mesh.constant('VueApp', this.vue);
    this.mesh.service(UserService);
  }
}
```

```ts
// src/services/UserService.ts
@provide('userService')
export class UserService {

  @dep() private notifications!: NotificationsService;

  users: User[] = [];
  loading = false;

  async refreshUsers() {
    try {
      const res = await fetch('/users');
      const data = await res.json();
      this.users = data.users;
    } catch (error) {
      this.users = [];
      this.notifications.addNotification('error', 'Failed to refresh users');
    } finally {
      this.loading = false;
    }
  }

}
```

```ts
// src/services/NotificationsService.ts
export interface Notification {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

@provide('notifications')
export class NotificationsService {

  notifications: Notification[] = [];

  addNotification(level: Notification['level'], message: string, timeout: number = 5000) {
    const id = Math.random().toString(36).substring(2);
    this.notifications.push({ id, level, message });
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, timeout);
  }

}
```

## Is this the right fit?

Luminable is not for everyone — and that’s intentional. It is most useful if you recognize yourself in one or more of the following situations.

### You’ve outgrown a traditional framework

You started with a popular framework, were productive early on, and later found yourself working around its assumptions more than benefiting from them — adding layers, escape hatches, and custom glue just to make your application fit.

You want to be in control of your application architecture, not be limited by the framework’s assumptions.

### Your code feels like 1% of what's running in your application

Your framework invites you to `// TODO write your code here`, amid a sea of boilerplate and hidden abstractions you don't fully understand.

This feeling becomes even more pronounced in full-stack frameworks, where so many concerns are encapsulated inside an opaque runtime, that even implications of various aspects of your own code are not immediately obvious.

### You want a unified architectural model across frontend and backend

You value having the same mental model — class-based composition, dependency injection, design by contract — regardless of whether you’re building a server, a UI, a command line tool or a background process. You want to use the same mental model, same structural conventions, same means of communication between components.

### You see conventions as tools, not constraints

You appreciate sensible defaults and shared patterns, but want the freedom to replace, extend, or completely redefine them when your application demands it.

