import { glob, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { RootWorkspacePackage, RootWorkspacePackageSchema } from './schema/RootWorkspacePackage.js';
import { WorkspacePackage, WorkspacePackageSchema } from './schema/WorkspacePackage.js';

export interface WorkspacePackageEntry {
    path: string;
    package: WorkspacePackage;
}

interface ListOptions {
    rootDir?: string;
}

export async function readRootWorkspacePackage(rootDir: string): Promise<RootWorkspacePackage> {
    const packagePath = join(rootDir, 'package.json');
    const packageText = await readFile(packagePath, 'utf-8');
    return RootWorkspacePackageSchema.decode(JSON.parse(packageText), { strictRequired: true });
}

export async function *listWorkspacePackagePaths(rootDir: string, workspaces: string[]): AsyncGenerator<string> {
    for await (const workspacePath of glob(workspaces, { cwd: rootDir })) {
        yield join(rootDir, workspacePath, 'package.json');
    }
}

export async function readWorkspacePackage(packagePath: string): Promise<WorkspacePackage> {
    const packageText = await readFile(packagePath, 'utf-8');
    return WorkspacePackageSchema.decode(JSON.parse(packageText), { strictRequired: true });
}

export async function readWorkspacePackageText(packagePath: string): Promise<string> {
    return readFile(packagePath, 'utf-8');
}

export async function listWorkspacePackages(options: ListOptions = {}): Promise<WorkspacePackageEntry[]> {
    const rootDir = options.rootDir ?? process.cwd();
    const rootPackage = await readRootWorkspacePackage(rootDir);
    const packages: WorkspacePackageEntry[] = [];
    for await (const packagePath of listWorkspacePackagePaths(rootDir, rootPackage.workspaces)) {
        const workspacePackage = await readWorkspacePackage(packagePath);
        packages.push({
            path: packagePath,
            package: workspacePackage
        });
    }
    return packages;
}
