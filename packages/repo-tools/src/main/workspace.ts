import { glob, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface RootWorkspacePackage {
    name?: string;
    version: string;
    workspaces: string[];
}

export interface WorkspacePackage {
    name: string;
    private?: boolean;
}

export async function readRootWorkspacePackage(rootDir: string): Promise<RootWorkspacePackage> {
    const packagePath = join(rootDir, 'package.json');
    const packageText = await readFile(packagePath, 'utf-8');
    return JSON.parse(packageText) as RootWorkspacePackage;
}

export async function *listWorkspacePackagePaths(rootDir: string, workspaces: string[]): AsyncGenerator<string> {
    for await (const workspacePath of glob(workspaces, { cwd: rootDir })) {
        yield join(rootDir, workspacePath, 'package.json');
    }
}

export async function readWorkspacePackage(packagePath: string): Promise<WorkspacePackage> {
    const packageText = await readFile(packagePath, 'utf-8');
    return JSON.parse(packageText) as WorkspacePackage;
}

export async function readWorkspacePackageText(packagePath: string): Promise<string> {
    return readFile(packagePath, 'utf-8');
}

export function inferPrefixFromRootPackageName(rootPackageName: string | undefined): string {
    if (typeof rootPackageName !== 'string') {
        throw new Error('Cannot infer prefix: root package name is missing');
    }
    const prefixScope = rootPackageName.match(/^(@[^/]+)\//)?.[1];
    if (!prefixScope) {
        throw new Error(`Cannot infer prefix from root package name "${rootPackageName}"`);
    }
    return `${prefixScope}/`;
}

export function normalizePrefix(prefix: string): string {
    return prefix.endsWith('/') ? prefix : `${prefix}/`;
}
