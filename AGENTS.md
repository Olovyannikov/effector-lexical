# AGENTS.md

Guidance for AI agents working in this repository.

## What this is

`effector-lexical` — effector bindings for the Lexical editor. It bridges
Lexical's imperative API (mutable editor + `register*` listeners + commands) to
effector stores/events/effects. See `SPEC.md` for the authoritative behaviour
and `docs/public/llms-full.txt` for a condensed inline reference.

## Layout

```
src/core/   framework-agnostic model (owns the LexicalEditor)
src/react/  React adapter (injects editor into LexicalComposerContext)
src/index.ts            → core entry (export .)
src/react/index.ts      → react entry (export ./react)
docs/       VitePress site (+ public/llms.txt, llms-full.txt)
examples/react-basic/   runnable demo (pnpm workspace)
```

## Commands

| Action      | Command                                  |
| ----------- | ---------------------------------------- |
| Install     | `pnpm install`                           |
| Build       | `pnpm build` (Vite lib, ESM+CJS, d.ts)   |
| Test        | `pnpm test` · `pnpm test:coverage`       |
| Type-check  | `pnpm typecheck`                         |
| Lint/format | `pnpm lint` · `pnpm format`              |
| Docs        | `pnpm docs:dev` · `pnpm docs:build`      |
| Example     | `pnpm --filter @example/react-basic dev` |

## Conventions

- **Conventional Commits** (commitlint + lefthook enforce this). Scope examples:
  `core`, `react`, `docs`, `ci`.
- Keep the **core framework-agnostic** — anything React goes in `src/react`.
- Maintain **100% line coverage** for `src`.
- Update `SPEC.md`, the docs, and `docs/public/llms-full.txt` when behaviour
  changes.

## The one gotcha

Lexical treats a listener's return value as a teardown function
(`listener(...args) || undefined`). Calling an effector event returns its
payload, so **every internal listener callback must return `void`** — wrap event
calls in a block:

```ts
editor.registerUpdateListener((p) => {
  someEvent(p);
}); // ✅
editor.registerUpdateListener((p) => someEvent(p)); // ❌ stores payload as "unregister"
```

This is why `destroy()` would otherwise throw "unregister is not a function".
