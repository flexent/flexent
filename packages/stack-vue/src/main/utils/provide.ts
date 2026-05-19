import { Mesh, ServiceConstructor } from 'mesh-ioc';
import { App as VueApp } from 'vue';

export const globalProvideMap = new Map<string, ServiceConstructor<any>>();

export function provide(alias: string) {
    return function (target: ServiceConstructor<any>) {
        globalProvideMap.set(alias, target);
    };
}

export function provideAll(mesh: Mesh, vue: VueApp) {
    const provides: Record<string, any> = {};
    for (const [alias, ctor] of globalProvideMap) {
        const instance = mesh.resolve(ctor);
        vue.provide(alias, instance);
        provides[alias] = instance;
    }
    return provides;
}
