# Recipes

Practical, copy-pasteable patterns built from the core units. They are
framework-agnostic unless noted; in React, read stores with `useUnit` from
`effector-react`.

## Categories

- [**State sync**](./state) — autosave, load from server, persist to storage,
  controlled value, two-way binding.
- [**Commands & toolbar**](./commands) — bind Lexical commands to events,
  observe dispatches, keyboard shortcuts, active-format state.
- [**Selection & formatting**](./selection) — selection-aware toolbar, current
  block type, links under the caret.
- [**Nodes & content**](./nodes) — react to node mutations, programmatic edits,
  read-only mode, counters, transforms.
- [**Scope, SSR & testing**](./scope) — scope-safety notes, forked tests and
  server-side state parsing.

Every recipe assumes a model:

```ts
import { createEditorModel } from 'effector-lexical';

export const editor = createEditorModel({
  namespace: 'app',
  onError: (e) => {
    throw e;
  },
});
```
