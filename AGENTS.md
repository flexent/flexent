Flexent is a frameworkless application toolkit utilizing Object Oriented Programming and Inversion of Control. It contains micro-libraries for common concerns and optional stack modules.

## Packages

- `@flexent/errors` (`packages/errors`): Generic error classes with standardized name, message and status code.
- `@flexent/eslint-config` (`packages/eslint-config`): Flexent ESLint Config.
- `@flexent/http-router` (`packages/http-router`): Decorator-based routing for HTTP server.
- `@flexent/http-server` (`packages/http-server`): Idiomatic HTTP server API.
- `@flexent/init-decorator` (`packages/init-decorator`): `@init` decorator for `mesh-ioc`.
- `@flexent/logger` (`packages/logger`): Idiomatic logger API supporting custom formatting and transports.
- `@flexent/metrics` (`packages/metrics`): Idiomatic API for collecting application metrics.
- `@flexent/pathmatcher` (`packages/pathmatcher`): Path matching utils for pathname-based routing.
- `@flexent/stack-backend` (`packages/stack-backend`): Backend basic setup.
- `@flexent/stack-vue` (`packages/stack-vue`): Vue basic setup.

## Required References

- All edits must follow the [shared repository guidelines](GUIDELINES.md).
- Use package-local guides `packages/*/AGENTS.md` when editing package files.

## Commit Style

- Do not commit changes unless explicitly instructed to do so.
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
