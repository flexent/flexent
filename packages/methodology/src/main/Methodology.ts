import {
    existsSync,
    lstatSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface MethodologyIssue {
    path: string;
    message: string;
}

const NAME = 'flexent';
const TITLE = 'Flexent';
const RULES = `.agents/${NAME}/RULES.md`;
/** The one line in the project's `AGENTS.md`; sync finds it by its `[Flexent] ` prefix. */
const POINTER = `[${TITLE}] Follow ${RULES}`;
const MANAGED = `<!-- Managed by @flexent/methodology: \`npx ${NAME}-methodology sync\` rewrites this file. -->`;
/** The block earlier versions wrote into `AGENTS.md`; sync removes it. */
const LEGACY_BEGIN = `<!-- ${NAME}-methodology:begin -->`;
const LEGACY_END = `<!-- ${NAME}-methodology:end -->`;

/**
 * Installs the methodology into a project and checks that it stays current. Everything it writes is
 * its own, except one line in `AGENTS.md`:
 *
 * - `.agents/flexent/RULES.md`: the always-on rules, the one real document;
 * - `AGENTS.md`: the line `[Flexent] Follow .agents/flexent/RULES.md`, upserted near the end
 *   (Codex and other agents read only `AGENTS.md`); the rest of the file is the project's;
 * - `.claude/rules/flexent.md`: a link to the rules, which Claude Code loads on every session;
 * - `.cursor/rules/flexent.mdc`: the rules as an always-on Cursor rule;
 * - the skill under `.agents/skills`, linked from `.claude/skills`;
 * - `CLAUDE.md` importing `AGENTS.md`, only when the project has none.
 */
export class Methodology {

    constructor(
        readonly rootDir: string,
        readonly packageDir = fileURLToPath(new URL('../..', import.meta.url)),
    ) {}

    get rules(): string {
        return readFileSync(join(this.packageDir, 'AGENTS.md'), 'utf8').trim();
    }

    /** Writes everything that is missing or stale. Returns the paths it touched. */
    sync(): string[] {
        return [
            ...this.syncSkill(),
            ...this.syncClaudeSkill(),
            ...this.syncRules(),
            ...this.syncClaudeRules(),
            ...this.syncCursorRule(),
            ...this.syncAgents(),
            ...this.syncClaude(),
        ];
    }

    /** Lists what `sync()` would change, without changing anything. */
    check(): MethodologyIssue[] {
        const issues: MethodologyIssue[] = [];
        const skillDir = join(this.rootDir, '.agents/skills', NAME);
        if (this.listDrift(this.skillSource, skillDir).length > 0) {
            issues.push(this.issue(skillDir, 'skill is missing or differs from the installed package'));
        }
        if (!this.exists(join(this.rootDir, '.claude/skills', NAME))) {
            issues.push(this.issue(join(this.rootDir, '.claude/skills', NAME), 'Claude Code skill link is missing'));
        }
        if (this.readText(RULES) !== this.renderRules()) {
            issues.push(this.issue(join(this.rootDir, RULES), 'rules are missing or stale'));
        }
        if (!this.claudeRulesCurrent()) {
            issues.push(this.issue(this.claudeRulesPath, 'Claude Code rules link is missing or stale'));
        }
        if (this.readText(this.cursorRulePath) !== this.renderCursorRule()) {
            issues.push(this.issue(join(this.rootDir, this.cursorRulePath), 'Cursor rule is missing or stale'));
        }
        if (this.readText('AGENTS.md') !== this.renderAgents(this.readText('AGENTS.md'))) {
            issues.push(this.issue(join(this.rootDir, 'AGENTS.md'), `the "${POINTER}" line is missing`));
        }
        if (!this.readText('CLAUDE.md').includes('@AGENTS.md')) {
            issues.push(this.issue(join(this.rootDir, 'CLAUDE.md'), 'does not import @AGENTS.md'));
        }
        return issues;
    }

    /**
     * The project's `AGENTS.md` with the pointer line upserted: replaced where a `[Flexent] ` line
     * is, otherwise appended at the end, beside other methodologies' pointer lines. An earlier
     * version's managed block is removed. Nothing else changes.
     */
    renderAgents(current: string): string {
        const text = this.removeLegacyBlock(current);
        const lines = text.split('\n');
        const index = lines.findIndex(line => line.startsWith(`[${TITLE}] `));
        if (index >= 0) {
            lines[index] = POINTER;
            return lines.join('\n');
        }
        const body = text.trimEnd();
        if (!body) {
            return `${POINTER}\n`;
        }
        const last = body.slice(body.lastIndexOf('\n') + 1);
        const separator = /^\[[^\]]+\] Follow /.test(last) ? '\n' : '\n\n';
        return `${body}${separator}${POINTER}\n`;
    }

    /** The rules as the project gets them, in `.agents/flexent/RULES.md`. */
    renderRules(): string {
        return `${MANAGED}\n\n${this.rules}\n`;
    }

    /** The always-on rules as a Cursor rule file. */
    renderCursorRule(): string {
        return `---\ndescription: ${TITLE} methodology\nalwaysApply: true\n---\n\n${this.rules}\n`;
    }

    private get skillSource(): string {
        return join(this.packageDir, 'skills', NAME);
    }

    private get claudeRulesPath(): string {
        return join(this.rootDir, '.claude/rules', `${NAME}.md`);
    }

    private get cursorRulePath(): string {
        return `.cursor/rules/${NAME}.mdc`;
    }

    private syncSkill(): string[] {
        const target = join(this.rootDir, '.agents/skills', NAME);
        if (this.listDrift(this.skillSource, target).length === 0) {
            return [];
        }
        rmSync(target, {
            recursive: true,
            force: true,
        });
        this.copyTree(this.skillSource, target);
        return [target];
    }

    /** Claude Code reads `.claude/skills`; a relative link keeps one copy of the skill. */
    private syncClaudeSkill(): string[] {
        const link = join(this.rootDir, '.claude/skills', NAME);
        if (this.exists(link)) {
            return [];
        }
        mkdirSync(dirname(link), { recursive: true });
        try {
            symlinkSync(join('../../.agents/skills', NAME), link, 'dir');
        } catch {
            this.copyTree(this.skillSource, link);
        }
        return [link];
    }

    private syncRules(): string[] {
        return this.writeIfChanged(RULES, this.renderRules());
    }

    /** Claude Code loads `.claude/rules/*.md` on every session; a relative link keeps one copy. */
    private syncClaudeRules(): string[] {
        if (this.claudeRulesCurrent()) {
            return [];
        }
        const link = this.claudeRulesPath;
        rmSync(link, { force: true });
        mkdirSync(dirname(link), { recursive: true });
        try {
            symlinkSync(join('../../.agents', NAME, 'RULES.md'), link, 'file');
        } catch {
            writeFileSync(link, this.renderRules());
        }
        return [link];
    }

    private syncCursorRule(): string[] {
        return this.writeIfChanged(this.cursorRulePath, this.renderCursorRule());
    }

    private syncAgents(): string[] {
        const current = this.readText('AGENTS.md');
        return this.writeIfChanged('AGENTS.md', this.renderAgents(current));
    }

    /** Claude Code does not read `AGENTS.md` on its own. An existing `CLAUDE.md` is never rewritten. */
    private syncClaude(): string[] {
        const file = join(this.rootDir, 'CLAUDE.md');
        if (this.exists(file)) {
            return [];
        }
        writeFileSync(file, '@AGENTS.md\n');
        return [file];
    }

    /** A link to the rules, or (where links aren't possible) a current copy of them. */
    private claudeRulesCurrent(): boolean {
        const link = this.claudeRulesPath;
        if (!this.exists(link)) {
            return false;
        }
        if (lstatSync(link).isSymbolicLink()) {
            return existsSync(link);
        }
        return readFileSync(link, 'utf8') === this.renderRules();
    }

    private removeLegacyBlock(text: string): string {
        const start = text.indexOf(LEGACY_BEGIN);
        const end = text.indexOf(LEGACY_END);
        if (start < 0 || end < start) {
            return text;
        }
        return text.slice(0, start) + text.slice(end + LEGACY_END.length).replace(/^\n+/, '');
    }

    private writeIfChanged(name: string, content: string): string[] {
        if (this.readText(name) === content) {
            return [];
        }
        const file = join(this.rootDir, name);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, content);
        return [file];
    }

    /** Relative paths that are missing, extra or different between two directory trees. */
    private listDrift(source: string, target: string): string[] {
        const sourceFiles = this.listFiles(source);
        const targetFiles = this.listFiles(target);
        const changed = sourceFiles.filter(file => {
            return !targetFiles.includes(file) || !this.sameFile(join(source, file), join(target, file));
        });
        const extra = targetFiles.filter(file => !sourceFiles.includes(file));
        return [...changed, ...extra];
    }

    private listFiles(dir: string): string[] {
        if (!existsSync(dir)) {
            return [];
        }
        return readdirSync(dir, {
            recursive: true,
            withFileTypes: true,
        }).filter(entry => entry.isFile()).map(entry => relative(dir, join(entry.parentPath, entry.name)));
    }

    /** Plain reads and writes: no attributes copied, so it works on any filesystem. */
    private copyTree(source: string, target: string) {
        for (const file of this.listFiles(source)) {
            mkdirSync(dirname(join(target, file)), { recursive: true });
            writeFileSync(join(target, file), readFileSync(join(source, file)));
        }
    }

    private sameFile(left: string, right: string): boolean {
        return readFileSync(left).equals(readFileSync(right));
    }

    private readText(name: string): string {
        const file = join(this.rootDir, name);
        return existsSync(file) ? readFileSync(file, 'utf8') : '';
    }

    private exists(path: string): boolean {
        try {
            lstatSync(path);
            return true;
        } catch {
            return false;
        }
    }

    private issue(path: string, message: string): MethodologyIssue {
        return {
            path: relative(this.rootDir, path),
            message,
        };
    }

}
