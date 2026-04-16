import { invokeInitHandlers } from '@luminable/init-decorator';
import { Mesh } from 'mesh-ioc';
import { type App as VueApp, reactive } from 'vue';

import { provideAll } from './utils/provide.js';

export abstract class BaseApp {

    mesh: Mesh;
    vue: VueApp;
    mountSelector = '#root';

    constructor() {
        this.vue = this.createVueApp();
        this.mesh = new Mesh();
        this.mesh.use(instance => reactive(instance));
        this.mesh.constant('vue', this.vue);
    }

    abstract createVueApp(): VueApp;

    async start() {
        provideAll(this.mesh, this.vue);
        await invokeInitHandlers(this.mesh);
        this.vue.mount(this.mountSelector);
    }

}
