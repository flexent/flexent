import { invokeInitHandlers } from '@flexent/init-decorator';
import { Mesh } from 'mesh-ioc';
import { App as VueApp, reactive } from 'vue';

import { provideAll } from './utils/provide.js';

export abstract class BaseApp {

    mesh: Mesh;
    vue: VueApp;
    mountSelector = '#root';

    constructor(vue: VueApp) {
        this.vue = vue;
        this.mesh = new Mesh();
        this.mesh.use(instance => reactive(instance));
        this.mesh.constant('vue', this.vue);
    }

    async start() {
        provideAll(this.mesh, this.vue);
        await invokeInitHandlers(this.mesh);
        this.mount();
    }

    mount() {
        this.vue.mount(this.mountSelector);
    }

}
