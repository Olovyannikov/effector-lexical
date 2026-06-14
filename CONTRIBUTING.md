# Contributing

Thanks for your interest in `effector-lexical`!

## Setup

```bash
pnpm install
```

This installs dependencies, links the example workspace and sets up git hooks
via lefthook.

## Workflow

| Task          | Command                                  |
| ------------- | ---------------------------------------- |
| Build library | `pnpm build`                             |
| Run tests     | `pnpm test`                              |
| Coverage      | `pnpm test:coverage`                     |
| Type-check    | `pnpm typecheck`                         |
| Lint          | `pnpm lint`                              |
| Format        | `pnpm format`                            |
| Docs (local)  | `pnpm docs:dev`                          |
| Example app   | `pnpm --filter @example/react-basic dev` |

## Git hooks

`lefthook` runs on commit:

- **pre-commit** — eslint, prettier check and `tsc`.
- **commit-msg** — commitlint ([Conventional Commits](https://www.conventionalcommits.org/)).

Commit messages must follow Conventional Commits, e.g.:

```
feat(core): add mutations() helper
fix(react): forward theme into composer context
docs: document the autosave recipe
```

## Pull requests

1. Keep the core framework-agnostic — React-specific code lives in `src/react`.
2. Add or update tests; coverage should stay at 100% for `src`.
3. Update `SPEC.md` and the docs when behaviour changes.
