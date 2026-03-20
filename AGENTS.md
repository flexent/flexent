Luminable is a frameworkless application toolkit utilizing Object Oriented Programming and Inversion of Control. It contains micro-libraries for common concerns and optional stack modules.

## Packages

- `@luminable/errors` (`packages/errors`): Generic error classes with standardized name, message and status code.
- `@luminable/eslint-config` (`packages/eslint-config`): Luminable ESLint Config.
- `@luminable/http-router` (`packages/http-router`): Decorator-based routing for HTTP server.
- `@luminable/http-server` (`packages/http-server`): Idiomatic HTTP server API.
- `@luminable/init-decorator` (`packages/init-decorator`): `@init` decorator for `mesh-ioc`.
- `@luminable/logger` (`packages/logger`): Idiomatic logger API supporting custom formatting and transports.
- `@luminable/metrics` (`packages/metrics`): Idiomatic API for collecting application metrics.
- `@luminable/pathmatcher` (`packages/pathmatcher`): Path matching utils for pathname-based routing.
- `@luminable/stack-backend` (`packages/stack-backend`): Backend basic setup.
- `@luminable/stack-vue` (`packages/stack-vue`): Vue basic setup.

## Required References

- All edits must follow the [shared repository guidelines](docs/GUIDELINES.md).
- Use package-local guides `packages/*/AGENTS.md` when editing package files.

## Commit Style

- Use Conventional Commits for every commit message.
- Format: `type: short summary` (lowercased, no dot at the end)
- Allowed types: `feat`, `fix`, `docs`, `chore`, `style`, `refactor`, `build`.

## Change Checklist

- [ ] Scope changes to the correct package(s); keep modules focused.
- [ ] Follow package-local requirements in the corresponding `packages/*/AGENTS.md`.
- [ ] Follow the OOP and Dependency Injection guidelines.
- [ ] Keep docs concise and scannable with proper fenced code blocks.
- [ ] In Markdown separate blocks with a single blank line.
- [ ] Run relevant build/dev checks before finishing (`npm run build` or package-specific scripts).
- [ ] Commit messages follow the Commit Style.
