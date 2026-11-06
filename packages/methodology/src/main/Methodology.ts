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

const BEGIN = '<!-- flexent-methodology:begin -->';
const END = '<!-- flexent-methodology:end -->';
const SKILL = 'flexent';

/**
 * Installs the methodology into a project and checks that it stays current:
 * the always-on rules as a managed block in `AGENTS.md`, the skill under `.agents/skills`
 * (linked from `.claude/skills`), and a `CLAUDE.md` that imports `AGENTS.md`.
 * Everything else in those files belongs to the project and is left alone.
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
            ...this.syncAgents(),
            ...this.syncClaude(),
        ];
    }

    /** Lists what `sync()` would change, without changing anything. */
    check(): MethodologyIssue[] {
        const issues: MethodologyIssue[] = [];
        const skillDir = join(this.rootDir, '.agents/skills', SKILL);
        if (this.listDrift(this.skillSource, skillDir).length > 0) {
            issues.push(this.issue(skillDir, 'skill is missing or differs from the installed package'));
        }
        if (!existsSync(join(this.rootDir, '.claude/skills', SKILL))) {
            issues.push(this.issue(join(this.rootDir, '.claude/skills', SKILL), 'Claude Code skill link is missing'));
        }
        if (this.readText('AGENTS.md') !== this.renderAgents(this.readText('AGENTS.md'))) {
            issues.push(this.issue(join(this.rootDir, 'AGENTS.md'), 'methodology block is missing or stale'));
        }
        if (!this.readText('CLAUDE.md').includes('@AGENTS.md')) {
            issues.push(this.issue(join(this.rootDir, 'CLAUDE.md'), 'does not import @AGENTS.md'));
        }
        return issues;
    }

    /** The project's `AGENTS.md` with the methodology block inserted or refreshed. */
    renderAgents(current: string): string {
        const block = `${BEGIN}\n${this.rules}\n${END}`;
        const start = current.indexOf(BEGIN);
        const end = current.indexOf(END);
        if (start >= 0 && end > start) {
            return current.slice(0, start) + block + current.slice(end + END.length);
        }
        const rest = current.trim() || '## Project\n\nDescribe the packages, apps and local conventions here.';
        return `${block}\n\n${rest}\n`;
    }

    /** The always-on rules as a Cursor rule file. */
    renderCursorRule(): string {
        return `---\ndescription: Flexent methodology\nalwaysApply: true\n---\n\n${this.rules}\n`;
    }

    private get skillSource(): string {
        return join(this.packageDir, 'skills', SKILL);
    }

    private syncSkill(): string[] {
        const target = join(this.rootDir, '.agents/skills', SKILL);
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
        const link = join(this.rootDir, '.claude/skills', SKILL);
        if (this.exists(link)) {
            return [];
        }
        mkdirSync(dirname(link), { recursive: true });
        try {
            symlinkSync(join('../../.agents/skills', SKILL), link, 'dir');
        } catch {
            this.copyTree(this.skillSource, link);
        }
        return [link];
    }

    private syncAgents(): string[] {
        const current = this.readText('AGENTS.md');
        const next = this.renderAgents(current);
        if (next === current) {
            return [];
        }
        writeFileSync(join(this.rootDir, 'AGENTS.md'), next);
        return [join(this.rootDir, 'AGENTS.md')];
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
