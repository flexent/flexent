# Principles

These are the values. The rest of Codeshade applies them to specific situations.

## Objects own behavior, functions own math

Codeshade is OOP-first. State and the behavior that changes it live together in a class, and classes are wired together by an IoC container rather than by passing context around.

Some things are best expressed as plain functions: arithmetic, geometry kernels, string formatting. Those live in helper modules and utility packages. The two never mix in one module (see [Modules](./modules.md)).

## One source of truth per fact

Every piece of data has exactly one owner and one shape.

- A setting is stored in the shape its form produces. It is not mirrored into a second "flat" shape with mappers between them.
- A default is declared once, in the schema or form. Templates, `DEFAULT_*` constants and `?? fallback` chains that restate it are a second source, and they drift.
- An instance owns its data outright. Two owners of one object is a bug that has not happened yet (see [State](./state.md)).

## Contracts carry invariants

Make illegal states hard to represent, then trust them.

- Decode untrusted input once, at the boundary, with a schema. Everything past that boundary is typed and valid.
- If every caller re-checks the same preconditions, the contract is weak: move the check into the producer.
- Prefer non-nullable fields. Use `T | null` for a persisted value that can be absent and `field?: T` for partial updates.
- No defensive programming against your own code. A guard clause for every impossible case hides the real contract.

## Fewer is better

Minimize, in this order of importance: entities, layers, branches, arguments, mutable state, public members, exported symbols, lines, and words in names.

- No speculative abstractions, flags, or "just in case" options.
- Long methods, long lines, many arguments and nested branching are design smells. Fix the design rather than reformatting the symptom.
- Three similar call sites are fine. Abstract on the fourth, once the shape is known.

## Consistency beats cleverness

When there are two ways, follow the dominant local one and clean up the other if it is safe. Never introduce a third.

Consistency is structural as well as cosmetic. Use the same ownership boundaries, the same composition patterns, the same error paths, and the same directory roles.

## Fix drift on sight

If you notice an inconsistency, fix it, or write it down in `TODO.md`. Leaving it silently in place is how prototypes rot.
