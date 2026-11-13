# Principles

These are the values. [Conventions](./conventions.md) and [Rules](./rules.md) apply them to specific situations. When nothing there settles a question, come back here.

## Objects own behavior

Software made only of functions works, but every function then gets three different things through one parameter list:

| Kind | What it is | Where it lives in Flexent |
|---|---|---|
| **State** | the context the call works on, which outlives the call | fields, read through `this` |
| **Arguments** | what the caller decides on each call. The call means nothing without them: `zoom(factor)`, `deleteNote(id)` | parameters |
| **Dependencies** | the environment, configured once for many calls: storage, config, a logger, another service | the IoC container |

When all three travel as parameters, they blur. A logger rides next to a zoom factor, a spec gets threaded through five calls, and a signature grows to a dozen arguments. A class keeps them apart: it gives the functions a namespace and a shared context (`this`), and the container gives them their environment. What's left in the signature is what the caller decides. Contracts and separation of concerns start from that distinction.

Plain functions still have their place: value types like vectors, boxes and money, and generic code like slugs and cookie parsing. Statics have none. They're functions that escape the container.

## The subject decides the home

Every function has a subject: the thing it reads, checks, converts or computes. The subject decides where the function lives. A class's own steps are its methods. Code about something the app owns (an entity, a record, a format) belongs to that thing's owner. Only value types and generic code get helper modules. The decision table is in [Rules](./rules.md#where-code-goes).

## One source of truth per fact

Every piece of data has exactly one owner and one shape. A setting is stored in the shape its schema or form produces. A default is declared once, in that schema or form. An instance owns its data outright: two owners of one object is a bug that hasn't happened yet.

## Contracts carry invariants

Make illegal states hard to represent, then trust them. Decode untrusted input once, at the boundary. If every caller re-checks the same preconditions, move the check into the producer. Don't guard against your own contracts.

## Fewer is better

Minimize, in this order: entities, layers, branches, arguments, mutable state, public members, exported symbols, lines, and words in names. Long methods, long lines, many arguments and nested branches are design smells: fix the design, not the formatting. Never add speculative abstractions, flags or options.

## Consistency beats cleverness

Local precedent wins. When there are two ways, follow the dominant one and clean up the other if it's safe. Never introduce a third. Consistency is structural as well as cosmetic: the same ownership boundaries, composition patterns, error paths and directory roles.

## Fix drift on sight

If you notice an inconsistency, fix it, or write it down in `TODO.md`. Leaving it silently in place is how codebases rot.

## Projects extend Flexent

Flexent is the shared default. A project adds what's specific to it, such as its domain, rendering stack, design system or app shapes, in two places:

- **its own section of `AGENTS.md`**, outside the managed block, for rules that always apply;
- **a project skill** (`.agents/skills/<project>/`) for recipes and reference material that agents load on demand.

Inside that project, its own rules win over Flexent's. They extend the methodology: they don't fork it, and they don't restate it.
