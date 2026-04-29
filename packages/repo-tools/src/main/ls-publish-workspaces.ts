import {
    listWorkspacePackagePaths,
    readRootWorkspacePackage,
    readWorkspacePackage
} from './workspace.js';

interface ListOptions {
    rootDir?: string;
}

export async function listPublishWorkspaceNames(options: ListOptions = {}): Promise<string[]> {
    const rootDir = options.rootDir ?? process.cwd();
    const rootPackage = await readRootWorkspacePackage(rootDir);
    const names: string[] = [];
    for await (const packagePath of listWorkspacePackagePaths(rootDir, rootPackage.workspaces)) {
        const workspacePackage = await readWorkspacePackage(packagePath);
        if (workspacePackage.private) {
            continue;
        }
        names.push(workspacePackage.name);
    }
    return names;
}

export async function listPublishWorkspaceFlags(options: ListOptions = {}): Promise<string> {
    const names = await listPublishWorkspaceNames(options);
    return names.map(name => `-w ${name}`).join(' ');
}
