# TODO

Open work on the methodology itself.

- [ ] Teach `check-structure.mjs` the misplaced-helper signs it can see: helper modules named `utils`, `helpers`, `common` or `*-utils`, and helper functions whose first parameter is a class from the same package.
- [ ] Lint rule for view roles: components must not `inject`, and views must not take managers as props.
- [ ] Validate the skill with `skills-ref validate` in CI, and add a few eval prompts ("add a manager", "persist this setting", "extract this calculation from the manager") that check where an agent puts things, including whether it reaches for a `static`.
- [ ] Decide whether `XCatalog` registries should become container-bound instances, so tests and scopes can bind their own. Today they're the one static-only exception (`flexent/static-members` skips them).
- [ ] Write a recipe for a full-stack app: a Protocomm `proto` package, server domains, and a typed frontend client.
- [ ] Write a recipe for a CLI (`commands/` plus `services/`).
- [ ] Decide whether `controllers/` deserves more guidance, or whether keyed manager maps are the only pattern.
- [ ] Settle on how a form expresses conditional visibility. Today `syncForm()` mutates `isVisible` on singleton forms. A declarative `.visibleWhen(spec => …)` on controls would remove the mutation entirely.
- [ ] Cross-link with Nightshade docs once the "build your own design system" story there takes shape.
