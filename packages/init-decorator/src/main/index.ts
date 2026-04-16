import { createMemberDecorator, invokeMethods } from 'mesh-decorators';
import { type Mesh } from 'mesh-ioc';

export const init = createMemberDecorator('init');

export async function invokeInitHandlers(mesh: Mesh, recursive = true) {
    const promises = invokeMethods('init', mesh, recursive);
    await Promise.all(promises);
}
