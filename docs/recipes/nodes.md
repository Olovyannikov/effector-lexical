# Nodes & content

## React to node mutations

`mutations(NodeClass)` turns Lexical's mutation listener into an event whose
payload includes a `mutatedNodes` map (`NodeKey → 'created' | 'updated' |
'destroyed'`).

```ts
import { LinkNode } from '@lexical/link';

editor.mutations(LinkNode).watch(({ mutatedNodes }) => {
  for (const [key, kind] of mutatedNodes) {
    if (kind === 'created') analytics.track('link_added', { key });
  }
});
```

Skip the initial pass over existing nodes:

```ts
editor.mutations(LinkNode, { skipInitialization: true }).watch(/* … */);
```

## Count nodes of a type

```ts
import { ImageNode } from './nodes/ImageNode';

const $imageCount = createStore(0);

sample({
  clock: editor.updated,
  fn: () => editor.read(() => $nodesOfType(ImageNode).length),
  target: $imageCount,
});
```

## Programmatic edits

`updateFx` wraps `editor.update` and resolves after reconciliation.

```ts
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

const setContent = (value: string) =>
  editor.updateFx(() => {
    const root = $getRoot();
    root.clear();
    root.append($createParagraphNode().append($createTextNode(value)));
  });
```

Insert at the current selection:

```ts
import { $insertNodes, $createTextNode } from 'lexical';

const insertText = (text: string) =>
  editor.updateFx(() => {
    $insertNodes([$createTextNode(text)]);
  });
```

## Read-only toggle

`$editable` mirrors the mode automatically (`registerEditableListener`); flip it
through an effect.

```ts
const setEditable = createEvent<boolean>();
const setEditableFx = createEffect((editable: boolean) =>
  editor.editor.setEditable(editable),
);
sample({ clock: setEditable, target: setEditableFx });
```

## Character / word counters

```ts
const $chars = editor.$text.map((t) => t.length);
const $words = editor.$text.map((t) =>
  t.trim() ? t.trim().split(/\s+/).length : 0,
);
const $isEmpty = editor.$text.map((t) => t.trim().length === 0);
```

## Enforce a max length

```ts
const TOO_LONG = sample({
  clock: editor.textChanged,
  filter: (text) => text.length > 280,
});

sample({ clock: TOO_LONG, target: showLimitWarning });
```

## Focus / blur

```ts
const focus = createEvent();
sample({ clock: focus, target: editor.focusFx });
```
