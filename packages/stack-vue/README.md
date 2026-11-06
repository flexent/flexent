# @flexent/stack-vue

The default Vue 3 stack: a mesh-ioc composition root whose services are reactive and provided to Vue.

## Usage

```ts
// src/App.ts
import { BaseApp } from '@flexent/stack-vue';
import { App as VueApp } from 'vue';

import { UserManager } from './managers/UserManager.js';

export class App extends BaseApp {

    constructor(vue: VueApp) {
        super(vue);
        this.mesh.service(UserManager);
    }

}
```

```ts
// src/managers/UserManager.ts
import { provide } from '@flexent/stack-vue';
import { dependency } from 'mesh-ioc';

@provide('userManager')
export class UserManager {

    private api = dependency(this, ApiManager);

    users: User[] = [];

}
```

```js
// src/views/UsersView.vue
export default {
    inject: ['userManager'],
};
```

## What it does

- `BaseApp` creates the mesh, binds the Vue app as `'vue'`, and installs middleware that wraps every service in `reactive()`. Meshes (the app mesh and any child scope) and the Vue app stay raw.
- `@provide('alias')` registers a class to be provided to Vue under that alias.
- `start()` resolves every provided service, provides it to Vue, runs `@init()` handlers, and mounts the app (`#root` by default; override `mount()` for SSG).

Inject with `dependency(this, X)`: Vite's esbuild doesn't emit the decorator metadata that `@dep()` needs.
