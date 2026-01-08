import { invokeInitHandlers } from '@luminable/init-decorator';
import { Mesh } from 'mesh-ioc';
import { App as VueApp, Component, createApp, reactive } from 'vue';

import { provideAll } from './utils/provide.js';

export class BaseApp {

    mesh: Mesh;
    vue: VueApp;

    mountSelector = '#root';

    constructor(rootComponent: Component) {
        this.mesh = new Mesh();
        this.vue = createApp(rootComponent);
        this.mesh.use(instance => reactive(instance));
        this.mesh.constant('vueApp', this.vue);
    }

    async start() {
        provideAll(this.mesh, this.vue);
        await invokeInitHandlers(this.mesh);
        this.vue.mount(this.mountSelector);
    }

}
