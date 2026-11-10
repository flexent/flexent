import assert from 'assert';

import { bumpPackageText } from '../main/index.js';

describe('bumpPackageText', () => {

    const workspaceNames = [
        'nightshade',
        '@scope/lib',
        '@scope/lib-extra',
    ];

    it('bumps the version and workspace dependencies, keeping prefixes', () => {
        const text = JSON.stringify({
            name: '@scope/app',
            version: '1.0.0',
            dependencies: {
                '@scope/lib': '1.0.0',
                '@scope/lib-extra': '^1.0.0',
                commander: '^13.1.0',
            },
            peerDependencies: {
                nightshade: '~1.0.0',
            },
        }, null, 4) + '\n';
        const bumped = JSON.parse(bumpPackageText(text, '2.0.0', workspaceNames));
        assert.strictEqual(bumped.version, '2.0.0');
        assert.deepStrictEqual(bumped.dependencies, {
            '@scope/lib': '2.0.0',
            '@scope/lib-extra': '^2.0.0',
            commander: '^13.1.0',
        });
        assert.deepStrictEqual(bumped.peerDependencies, {
            nightshade: '~2.0.0',
        });
    });

    it('keeps keys outside dependency fields that match a workspace name', () => {
        const text = JSON.stringify({
            name: '@scope/cli',
            version: '1.0.0',
            bin: {
                nightshade: './out/cli.js',
            },
            scripts: {
                nightshade: 'node out/cli.js',
            },
        }, null, 4);
        const bumped = JSON.parse(bumpPackageText(text, '2.0.0', workspaceNames));
        assert.deepStrictEqual(bumped.bin, {
            nightshade: './out/cli.js',
        });
        assert.deepStrictEqual(bumped.scripts, {
            nightshade: 'node out/cli.js',
        });
    });

    it('keeps specs that are not versions', () => {
        const text = JSON.stringify({
            name: '@scope/app',
            version: '1.0.0',
            devDependencies: {
                '@scope/lib': 'file:../lib',
                nightshade: 'workspace:*',
            },
        }, null, 4);
        const bumped = JSON.parse(bumpPackageText(text, '2.0.0', workspaceNames));
        assert.deepStrictEqual(bumped.devDependencies, {
            '@scope/lib': 'file:../lib',
            nightshade: 'workspace:*',
        });
    });

    it('preserves indentation and the trailing newline', () => {
        const spaced = '{\n    "name": "a",\n    "version": "1.0.0"\n}\n';
        const tabbed = '{\n\t"name": "a",\n\t"version": "1.0.0"\n}';
        assert.strictEqual(bumpPackageText(spaced, '2.0.0', workspaceNames), spaced.replace('1.0.0', '2.0.0'));
        assert.strictEqual(bumpPackageText(tabbed, '2.0.0', workspaceNames), tabbed.replace('1.0.0', '2.0.0'));
    });

});
