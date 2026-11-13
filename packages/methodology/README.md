# @flexent/methodology

How Flexent applications are organized, written for people and for coding agents.

Flexent is frameworkless: it doesn't decide your application's structure. The methodology does, at least as a shared default. It covers where code goes, state ownership, naming, module kinds, directories and package layers, so that a codebase stays coherent as it grows and as more people and agents work on it.

## Install

```sh
npm i --save-dev @flexent/methodology
```

On install, the package writes into the project that ran `npm install`:

| Path | What | Read by |
|------|------|---------|
| `AGENTS.md` | always-on rules, in a managed block between `<!-- flexent-methodology:begin -->` and `<!-- flexent-methodology:end -->`; the rest of the file is yours | Codex, Cursor, GitHub Copilot, Gemini CLI, and most other agents |
| `.agents/skills/flexent/` | the `flexent` Agent Skill: the full rule set, reasoning, conventions, structure checker | Codex, Cursor, GitHub Copilot, and other Agent Skills tools |
| `.claude/skills/flexent` | a link to the skill above | Claude Code |
| `CLAUDE.md` | `@AGENTS.md`, created only when missing | Claude Code, which doesn't read `AGENTS.md` on its own |

Commit these files. Agents that read the repository without installing anything (cloud agents, fresh clones) then see the same rules as everyone else.

The install step is skipped in CI, for global installs, and when `FLEXENT_METHODOLOGY_SKIP=1` is set. pnpm and Yarn don't run install scripts by default; with those, run `npx flexent-methodology sync` once after installing or upgrading.

## Commands

```sh
npx flexent-methodology sync [root]       # install or refresh the rules and skill
npx flexent-methodology check [root]      # exit 1 if they are missing or stale (for CI)
npx flexent-methodology structure [dir]   # report module kinds and directory roles that drifted
```

Upgrading the package and running `sync` refreshes the skill and the managed block, and leaves your own `AGENTS.md` sections and `CLAUDE.md` untouched.

## Other tools

| Tool | Rules | Skill |
|------|-------|-------|
| **Claude Code** (as a plugin) | — | `/plugin marketplace add flexent/flexent`, then `/plugin install flexent@flexent` |
| **Cursor** (as a plugin) | the plugin adds `rules/flexent.mdc` as an always-on rule | Customize → Plugins → From GitHub Repository → `flexent/flexent` |
| **Gemini CLI** | add `"context": { "fileName": ["AGENTS.md", "GEMINI.md"] }` to `.gemini/settings.json` | `.agents/skills/flexent` |
| **Claude.ai, Claude Desktop** | paste `AGENTS.md` into the project instructions | zip `skills/flexent` and upload it under Settings → Capabilities → Skills |
| **ChatGPT** (chat) | paste `AGENTS.md` into the project or custom instructions | upload `skills/flexent` where your plan supports skills, or attach the references you need |

A plugin installs the skill for one person. The npm package is what makes the rules part of the project.

## Guidelines

- [Principles](./skills/flexent/references/principles.md): the values behind every rule, and how projects extend the methodology.
- [Conventions](./skills/flexent/references/conventions.md): names, module kinds, directories, layers and package layout.
- [Rules](./skills/flexent/references/rules.md): always, never, when and when not, plus where code goes.
- [Frontend](./skills/flexent/references/frontend.md): the Vue stack, managers, controllers, views, components and reactivity.
- [Backend](./skills/flexent/references/backend.md): composition, contracts, storage and protocols.
- [IoC](./skills/flexent/references/ioc.md): service keys, services, constants, aliases, injection, connected instances and scopes.
- [Style](./skills/flexent/references/style.md): formatting, errors, comments, tests, commits, and the lint rules that enforce most of this.

## Extending it

The methodology is a shared default. A project adds its own domain rules, stack choices and recipes in its own sections of `AGENTS.md` (outside the managed block) and in project skills under `.agents/skills/<project>/`. Those win inside the project. See [Projects extend Flexent](./skills/flexent/references/principles.md#projects-extend-flexent).

Examples in the guidelines use neutral domains (notes, orders, invoices). They're illustrative.

## How it's built

The methodology has two layers, matching how coding agents load context:

- **Rules** ([`AGENTS.md`](./AGENTS.md)) load on every turn, so they stay short: only the non-negotiables.
- **The skill** ([`skills/flexent`](./skills/flexent/SKILL.md)) follows the open [Agent Skills](https://agentskills.io) format. Agents read only its name and description until a task needs it.

Add `@flexent/eslint-config` (and `@flexent/eslint-config-vue`) so that drift fails the build, not just the review.
