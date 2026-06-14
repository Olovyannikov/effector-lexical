# State sync

## Autosave (debounced) to a server

`updated` fires on every commit. Sample it into a debounced effect, taking the
serialized state from `$json`.

```ts
import { sample } from 'effector';
import { debounce } from 'patronum';

const saveFx = createEffect((json: unknown) =>
  fetch('/api/doc', { method: 'PUT', body: JSON.stringify(json) }),
);

sample({
  clock: debounce(editor.updated, 800),
  source: editor.$json,
  target: saveFx,
});
```

No `patronum`? Replace `debounce(editor.updated, 800)` with your own debounced
event.

## Save only on real content changes

`updated` fires for selection-only changes too. Gate on `textChanged` (or compare
`$json`) when you only care about content:

```ts
sample({
  clock: debounce(editor.textChanged, 800),
  source: editor.$json,
  target: saveFx,
});
```

## Load a document from the server

`setStateFx` accepts a JSON string, so a fetch that returns serialized state
pipes straight in.

```ts
const loadFx = createEffect((id: string) =>
  fetch(`/api/doc/${id}`).then((r) => r.text()),
);

sample({ clock: loadFx.doneData, target: editor.setStateFx });
```

## Persist to localStorage and restore on boot

```ts
const persistFx = createEffect((json: unknown) =>
  localStorage.setItem('doc', JSON.stringify(json)),
);

sample({ clock: editor.$json, target: persistFx });

const saved = localStorage.getItem('doc');
if (saved) editor.setStateFx(saved);
```

## Dirty / saved indicator

Track whether the current content differs from the last saved snapshot.

```ts
import { createStore } from 'effector';

const $savedJson = createStore<string | null>(null).on(
  saveFx.done,
  (_, { params }) => JSON.stringify(params),
);

const $isDirty = sample({
  source: { current: editor.$json, saved: $savedJson },
  fn: ({ current, saved }) => JSON.stringify(current) !== saved,
});
```

## Reset to an empty document

```ts
import { $getRoot } from 'lexical';

const clearFx = attach({
  effect: editor.updateFx,
  mapParams: () => () => {
    $getRoot().clear();
  },
});
```

## Export the current content

`read` runs synchronously against the latest state — handy for export buttons.

```ts
import { $generateHtmlFromNodes } from '@lexical/html';

const exportHtml = () =>
  editor.read(() => $generateHtmlFromNodes(editor.editor, null));

const exportJson = () => editor.$json.getState();
```
