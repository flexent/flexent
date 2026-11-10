import { writeFile } from 'node:fs/promises';

import { listWorkspacePackages, readRootWorkspacePackage, readWorkspacePackageText } from './workspace.js';

interface BumpOptions {
    rootDir?: string;
    logger?: Pick<Console, 'info'>;
}

const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
];

const VERSION_SPEC = /^([\^~]?)\d+\.\d+\.\d+/;

export async function bumpVersion(options: BumpOptions = {}): Promise<void> {
    const rootDir = options.rootDir ?? process.cwd();
    const logger = options.logger ?? console;
    const rootPackage = await readRootWorkspacePackage(rootDir);
    const newVersion = rootPackage.version;
    const workspacePackages = await listWorkspacePackages({ rootDir });
    const packageNames = workspacePackages.map(entry => entry.package.name);
    logger.info(`Bumping packages to ${newVersion}`);
    for (const entry of workspacePackages) {
        const packageText = await readWorkspacePackageText(entry.path);
        await writeFile(entry.path, bumpPackageText(packageText, newVersion, packageNames));
        logger.info(`Bumped ${entry.path} to ${newVersion}`);
    }
}

/**
 * Sets a manifest's `version`, and the versions of the workspace packages it depends on,
 * keeping their `^` or `~` prefix. Only dependency fields are read: a `bin`, `exports` or `scripts` key
 * that matches a workspace name keeps its value. Specs that aren't versions (`file:`, `workspace:`,
 * paths, tags) are kept too. The manifest's indentation and trailing newline are preserved.
 */
export function bumpPackageText(packageText: string, newVersion: string, workspaceNames: string[]): string {
    const manifest = JSON.parse(packageText);
    manifest.version = newVersion;
    for (const field of DEPENDENCY_FIELDS) {
        const dependencies: Record<string, string> = manifest[field] ?? {};
        for (const name of workspaceNames) {
            const prefix = dependencies[name]?.match(VERSION_SPEC)?.[1];
            if (prefix != null) {
                dependencies[name] = `${prefix}${newVersion}`;
            }
        }
    }
    const indent = packageText.match(/^[ \t]+(?=")/m)?.[0] ?? 2;
    const newline = packageText.endsWith('\n') ? '\n' : '';
    return JSON.stringify(manifest, null, indent) + newline;
}
