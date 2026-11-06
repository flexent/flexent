import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Methodology } from '../main/Methodology.js';

describe('Methodology', () => {

    let root: string;

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'flexent-methodology-'));
    });

    afterEach(() => {
        rmSync(root, {
            recursive: true,
            force: true,
        });
    });

    it('installs rules, skill and Claude import into an empty project', () => {
        const methodology = new Methodology(root);
        assert.equal(methodology.check().length, 4);
        methodology.sync();
        assert.ok(existsSync(join(root, '.agents/skills/flexent/SKILL.md')));
        assert.ok(existsSync(join(root, '.claude/skills/flexent/SKILL.md')));
        assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /# Flexent methodology/);
        assert.equal(readFileSync(join(root, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n');
        assert.deepEqual(methodology.check(), []);
        assert.deepEqual(methodology.sync(), []);
    });

    it('refreshes only its own block in AGENTS.md', () => {
        const methodology = new Methodology(root);
        writeFileSync(join(root, 'AGENTS.md'), '## Project\n\nLocal notes.\n');
        methodology.sync();
        const synced = readFileSync(join(root, 'AGENTS.md'), 'utf8');
        assert.ok(synced.startsWith('<!-- flexent-methodology:begin -->'));
        assert.ok(synced.endsWith('## Project\n\nLocal notes.\n'));
        const stale = synced.replace('# Flexent methodology', '# Old rules');
        writeFileSync(join(root, 'AGENTS.md'), stale);
        assert.equal(methodology.check()[0].path, 'AGENTS.md');
        methodology.sync();
        assert.equal(readFileSync(join(root, 'AGENTS.md'), 'utf8'), synced);
    });

    it('replaces a stale skill and leaves an existing CLAUDE.md alone', () => {
        const methodology = new Methodology(root);
        writeFileSync(join(root, 'CLAUDE.md'), 'Project notes\n');
        methodology.sync();
        writeFileSync(join(root, '.agents/skills/flexent/extra.md'), 'stale');
        assert.equal(methodology.check()[0].path, '.agents/skills/flexent');
        methodology.sync();
        assert.equal(existsSync(join(root, '.agents/skills/flexent/extra.md')), false);
        assert.equal(readFileSync(join(root, 'CLAUDE.md'), 'utf8'), 'Project notes\n');
        assert.equal(methodology.check()[0].message, 'does not import @AGENTS.md');
    });

    it('ships a Cursor rule generated from AGENTS.md', () => {
        const methodology = new Methodology(root);
        const shipped = readFileSync(join(methodology.packageDir, 'rules/flexent.mdc'), 'utf8');
        assert.equal(shipped, methodology.renderCursorRule());
    });

});
