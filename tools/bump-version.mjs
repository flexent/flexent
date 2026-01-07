import { glob, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const workspacePkg = JSON.parse(await readFile('package.json', 'utf-8'));

const workspaces = glob(workspacePkg.workspaces);
const newVersion = workspacePkg.version;
console.info(`Bumping packages to ${newVersion}`);

for await (const workspace of workspaces) {
    const pkgPath = join(workspace, 'package.json');
    const pkgText = await readFile(pkgPath, 'utf-8');
    // Replace in text to maintain the same format
    const replaced = pkgText
        .replace(/"(@luminable\/.*?)": ".*?"/g, `"$1": "^${newVersion}"`)
        .replace(/"version": ".*?"/g, `"version": "${newVersion}"`);
    await writeFile(pkgPath, replaced);
    console.info(`Bumped ${pkgPath} to ${newVersion}`);
}
