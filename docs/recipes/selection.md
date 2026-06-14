# Selection & formatting

Lexical recomputes selection on every update, so `updated` is the right clock for
deriving selection-aware UI state. The `updated` payload carries the new
`editorState`, so read from it inside `fn` — no hidden `getState`, the `fn` stays
pure with respect to its input.

## Active format state (bold/italic/…)

```ts
import { createStore } from 'effector';
import { $getSelection, $isRangeSelection } from 'lexical';

const $isBold = createStore(false);

sample({
  clock: editor.updated,
  fn: ({ editorState }) =>
    editorState.read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.hasFormat('bold') : false;
    }),
  target: $isBold,
});
```

Generalise to many formats at once:

```ts
const FORMATS = ['bold', 'italic', 'underline', 'code'] as const;

const $formats = createStore<Record<string, boolean>>({});

sample({
  clock: editor.updated,
  fn: ({ editorState }) =>
    editorState.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return {};
      return Object.fromEntries(
        FORMATS.map((f) => [f, selection.hasFormat(f)]),
      );
    }),
  target: $formats,
});
```

## Current block type (heading / paragraph / list)

```ts
import { $isHeadingNode } from '@lexical/rich-text';

const $blockType = createStore<string>('paragraph');

sample({
  clock: editor.updated,
  fn: ({ editorState }) =>
    editorState.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return 'paragraph';
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      return $isHeadingNode(element) ? element.getTag() : element.getType();
    }),
  target: $blockType,
});
```

## Is the caret inside a link?

```ts
import { $isLinkNode } from '@lexical/link';

const $linkUrl = createStore<string | null>(null);

sample({
  clock: editor.updated,
  fn: ({ editorState }) =>
    editorState.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return null;
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      if ($isLinkNode(parent)) return parent.getURL();
      if ($isLinkNode(node)) return node.getURL();
      return null;
    }),
  target: $linkUrl,
});
```

## Selected text

```ts
const $selectedText = createStore('');

sample({
  clock: editor.updated,
  fn: ({ editorState }) =>
    editorState.read(() => {
      const selection = $getSelection();
      return selection ? selection.getTextContent() : '';
    }),
  target: $selectedText,
});
```
