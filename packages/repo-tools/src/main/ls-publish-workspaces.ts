import { listWorkspacePackages } from './workspace.js';

interface ListOptions {
    rootDir?: string;
}

export async function listPublishWorkspaceNames(options: ListOptions = {}): Promise<string[]> {
    const packages = await listWorkspacePackages(options);
    const names: string[] = [];
    for (const entry of packages) {
        if (entry.package.private) {
            continue;
        }
        names.push(entry.package.name);
    }
    return names;
}

export async function listPublishWorkspaceFlags(options: ListOptions = {}): Promise<string> {
    const names = await listPublishWorkspaceNames(options);
    return names.map(name => `-w ${name}`).join(' ');
}
