import { InitializationError } from '@flexent/errors';
import { type Mesh } from 'mesh-ioc';

export function assertMissingDeps(mesh: Mesh) {
    const missingDepKeys = [...mesh.missingDeps()].map(_ => _.key);
    if (missingDepKeys.length > 0) {
        throw new InitializationError(`The following class dependencies are not found in application global scope: ${missingDepKeys}`);
    }
}
