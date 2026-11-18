import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Methodology } from '../main/Methodology.js';

const POINTER = '[Flexent] Follow .agents/flexent/RULES.md';

describe('Methodology', () => {

    let root: string;

    const read = (name: string) => readFileSync(join(root, name), 'utf8');

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'flexent-methodology-'));
    });

    afterEach(() => {
        rmSync(root, {
            recursive: true,
            force: true,
        });
    });

    it('installs rules, links, skill and the pointer into an empty project', () => {
        const methodology = new Methodology(root);
        assert.equal(methodology.check().length, 7);
        methodology.sync();
        assert.ok(existsSync(join(root, '.agents/skills/flexent/SKILL.md')));
        assert.ok(existsSync(join(root, '.claude/skills/flexent/SKILL.md')));
        assert.match(read('.agents/flexent/RULES.md'), /# Flexent methodology/);
        assert.ok(lstatSync(join(root, '.claude/rules/flexent.md')).isSymbolicLink());
        assert.equal(read('.claude/rules/flexent.md'), read('.agents/flexent/RULES.md'));
        assert.equal(read('.cursor/rules/flexent.mdc'), methodology.renderCursorRule());
        assert.equal(read('AGENTS.md'), `${POINTER}\n`);
        assert.equal(read('CLAUDE.md'), '@AGENTS.md\n');
        assert.deepEqual(methodology.check(), []);
        assert.deepEqual(methodology.sync(), []);
    });

    it('appends the pointer to AGENTS.md and changes nothing else', () => {
        const methodology = new Methodology(root);
        writeFileSync(join(root, 'AGENTS.md'), '# Project\n\nLocal notes.\n\n');
        methodology.sync();
        assert.equal(read('AGENTS.md'), `# Project\n\nLocal notes.\n\n${POINTER}\n`);
    });

    it('keeps the pointer where the project moved it, and next to other pointers', () => {
        const methodology = new Methodology(root);
        writeFileSync(join(root, 'AGENTS.md'), '# Project\n\n[Flexent] Follow old/path.md\n\nMore notes.\n');
        assert.ok(methodology.check().some(issue => issue.path === 'AGENTS.md'));
        methodology.sync();
        assert.equal(read('AGENTS.md'), `# Project\n\n${POINTER}\n\nMore notes.\n`);
        writeFileSync(join(root, 'AGENTS.md'), '# Project\n\n[Nightshade] Follow .agents/nightshade/RULES.md\n');
        methodology.sync();
        assert.equal(read('AGENTS.md'), `# Project\n\n[Nightshade] Follow .agents/nightshade/RULES.md\n${POINTER}\n`);
    });

    it('removes the managed block earlier versions wrote', () => {
        const methodology = new Methodology(root);
        writeFileSync(join(root, 'AGENTS.md'), [
            '<!-- flexent-methodology:begin -->',
            '# Flexent methodology',
            '<!-- flexent-methodology:end -->',
            '',
            '## Project',
            '',
            'Local notes.',
            '',
        ].join('\n'));
        methodology.sync();
        assert.equal(read('AGENTS.md'), `## Project\n\nLocal notes.\n\n${POINTER}\n`);
    });

    it('refreshes stale rules and skill, and leaves an existing CLAUDE.md alone', () => {
        const methodology = new Methodology(root);
        writeFileSync(join(root, 'CLAUDE.md'), 'Project notes\n');
        methodology.sync();
        writeFileSync(join(root, '.agents/skills/flexent/extra.md'), 'stale');
        writeFileSync(join(root, '.agents/flexent/RULES.md'), 'old rules');
        const paths = methodology.check().map(issue => issue.path);
        assert.ok(paths.includes('.agents/skills/flexent'));
        assert.ok(paths.includes('.agents/flexent/RULES.md'));
        methodology.sync();
        assert.equal(existsSync(join(root, '.agents/skills/flexent/extra.md')), false);
        assert.match(read('.claude/rules/flexent.md'), /# Flexent methodology/);
        assert.equal(read('CLAUDE.md'), 'Project notes\n');
        assert.equal(methodology.check()[0].message, 'does not import @AGENTS.md');
    });

    it('ships a Cursor rule generated from the rules', () => {
        const methodology = new Methodology(root);
        const shipped = readFileSync(join(methodology.packageDir, 'rules/flexent.mdc'), 'utf8');
        assert.equal(shipped, methodology.renderCursorRule());
    });

});
