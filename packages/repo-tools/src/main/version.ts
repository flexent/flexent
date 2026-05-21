import { writeFile } from 'node:fs/promises';

import { listWorkspacePackages, readRootWorkspacePackage, readWorkspacePackageText } from './workspace.js';

interface BumpOptions {
    rootDir?: string;
    logger?: Pick<Console, 'info'>;
}

export async function bumpVersion(options: BumpOptions = {}): Promise<void> {
    const rootDir = options.rootDir ?? process.cwd();
    const logger = options.logger ?? console;
    const rootPackage = await readRootWorkspacePackage(rootDir);
    const newVersion = rootPackage.version;
    const workspacePackages = await listWorkspacePackages({ rootDir });
    const packageNames = workspacePackages.map(entry => entry.package.name);
    const dependencyPattern = buildWorkspaceDependencyPattern(packageNames);
    logger.info(`Bumping packages to ${newVersion}`);
    for (const entry of workspacePackages) {
        const packageText = await readWorkspacePackageText(entry.path);
        const replacedText = packageText
            .replace(dependencyPattern, `"$1": "^${newVersion}"`)
            .replace(/"version": ".*?"/g, `"version": "${newVersion}"`);
        await writeFile(entry.path, replacedText);
        logger.info(`Bumped ${entry.path} to ${newVersion}`);
    }
}

function buildWorkspaceDependencyPattern(packageNames: string[]): RegExp {
    const sortedNames = [...packageNames].sort((left, right) => right.length - left.length);
    const escapedNames = sortedNames.map(name => escapeRegExp(name)).join('|');
    return new RegExp(`"(${escapedNames})": "\\^.*?"`, 'g');
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
