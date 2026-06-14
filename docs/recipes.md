# Recipes

Practical patterns built from the core units. They are framework-agnostic unless
noted; in React, read stores with `useUnit`.

## Autosave (debounced) to a server

`updated` fires on every commit. Sample it into a debounced effect.

```ts
import { sample } from 'effector';
import { debounce } from 'patronum';
import { createEditorModel } from 'effector-lexical';

const editor = createEditorModel({ namespace: 'doc', onError: console.error });

const saveFx = createEffect((json: unknown) =>
  fetch('/api/doc', { method: 'PUT', body: JSON.stringify(json) }),
);

sample({
  clock: debounce(editor.updated, 800),
  source: editor.$json,
  target: saveFx,
});
```

No `patronum`? Use a `createEffect` with a timeout, or `delay`.

## Load a document from the server

```ts
const loadFx = createEffect((id: string) =>
  fetch(`/api/doc/${id}`).then((r) => r.text()),
);

// loadFx returns the serialized JSON string — setStateFx parses it.
sample({ clock: loadFx.doneData, target: editor.setStateFx });
```

## Persist to localStorage and restore on boot

```ts
sample({
  clock: editor.$json,
  target: createEffect((json) =>
    localStorage.setItem('doc', JSON.stringify(json)),
  ),
});

const saved = localStorage.getItem('doc');
if (saved) editor.setStateFx(saved);
```

## Read-only toggle

`$editable` mirrors the mode; flip it with an effect.

```ts
const setEditable = createEvent<boolean>();
const setEditableFx = createEffect((editable: boolean) =>
  editor.editor.setEditable(editable),
);
sample({ clock: setEditable, target: setEditableFx });

// editor.$editable stays in sync via registerEditableListener.
```

## Word / character counters as derived stores

```ts
const $chars = editor.$text.map((t) => t.length);
const $words = editor.$text.map((t) =>
  t.trim() ? t.trim().split(/\s+/).length : 0,
);
```

## Toolbar with bound commands

```ts
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  type TextFormatType,
} from 'lexical';

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
export const bold = format.dispatch.prepend(() => 'bold' as const);
export const italic = format.dispatch.prepend(() => 'italic' as const);
export const undo = editor.command<void>(UNDO_COMMAND).dispatch;
```

```tsx
const [onBold, onUndo] = useUnit([bold, undo]);
<button onClick={() => onBold()}>Bold</button>
<button onClick={() => onUndo()}>Undo</button>
```

## React to specific node mutations

```ts
import { LinkNode } from '@lexical/link';

editor.mutations(LinkNode).watch(({ mutatedNodes }) => {
  for (const [key, kind] of mutatedNodes) {
    if (kind === 'created') analytics.track('link_added', { key });
  }
});
```

## Derive selection-aware toolbar state

Combine `updated` with a `read` to compute active formats.

```ts
import { $getSelection, $isRangeSelection } from 'lexical';

const $isBold = createStore(false);

sample({
  clock: editor.updated,
  fn: () =>
    editor.read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.hasFormat('bold') : false;
    }),
  target: $isBold,
});
```

## Clean up

When a model is disposable (e.g. a per-route editor), release listeners:

```ts
onUnmount(() => editor.destroy());
```
