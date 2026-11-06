# TODO

Open work on the methodology itself.

- [ ] Lint rule for view roles: components must not `inject`, and views must not take managers as props.
- [ ] Validate the skill with `skills-ref validate` in CI, and add a few eval prompts ("add a manager", "persist this setting") that check where an agent puts things.
- [ ] Write a recipe for a full-stack app: a Protocomm `proto` package, server domains, and a typed frontend client.
- [ ] Write a recipe for a CLI (`commands/` plus `services/`).
- [ ] Decide whether `controllers/` deserves more guidance, or whether keyed manager maps are the only pattern.
- [ ] Settle on how a form expresses conditional visibility. Today `syncForm()` mutates `isVisible` on singleton forms. A declarative `.visibleWhen(spec => …)` on controls would remove the mutation entirely.
- [ ] Cross-link with Nightshade docs once the "build your own design system" story there takes shape.
