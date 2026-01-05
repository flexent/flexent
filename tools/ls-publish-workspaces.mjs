import { glob, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const workspacePkg = JSON.parse(await readFile('package.json', 'utf-8'));

const workspaces = glob(workspacePkg.workspaces);

const names = [];

for await (const workspace of workspaces) {
    const pkgPath = join(workspace, 'package.json');
    const pkgText = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgText);
    if (pkg.private) {
        continue;
    }
    names.push(`-w ${pkg.name}`);
}

console.info(names.join(' '));
