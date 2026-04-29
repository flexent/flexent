import { writeFile } from 'node:fs/promises';

import {
    inferPrefixFromRootPackageName,
    listWorkspacePackagePaths,
    normalizePrefix,
    readRootWorkspacePackage,
    readWorkspacePackageText
} from './workspace.js';

interface BumpOptions {
    rootDir?: string;
    prefix?: string;
    logger?: Pick<Console, 'info'>;
}

export async function bumpVersion(options: BumpOptions = {}): Promise<void> {
    const rootDir = options.rootDir ?? process.cwd();
    const logger = options.logger ?? console;
    const rootPackage = await readRootWorkspacePackage(rootDir);
    const newVersion = rootPackage.version;
    const inferredPrefix = inferPrefixFromRootPackageName(rootPackage.name);
    const prefix = normalizePrefix(options.prefix ?? inferredPrefix);
    const escapedPrefix = escapeRegExp(prefix);
    const dependencyPattern = new RegExp(`"(${escapedPrefix}.*?)": ".*?"`, 'g');
    logger.info(`Bumping packages to ${newVersion} (prefix: ${prefix})`);
    for await (const packagePath of listWorkspacePackagePaths(rootDir, rootPackage.workspaces)) {
        const packageText = await readWorkspacePackageText(packagePath);
        const replacedText = packageText
            .replace(dependencyPattern, `"$1": "^${newVersion}"`)
            .replace(/"version": ".*?"/g, `"version": "${newVersion}"`);
        await writeFile(packagePath, replacedText);
        logger.info(`Bumped ${packagePath} to ${newVersion}`);
    }
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
