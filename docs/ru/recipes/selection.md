# Выделение и форматирование

Lexical пересчитывает выделение на каждом обновлении, поэтому `updated` — это
правильный clock для вывода UI-состояния, зависящего от выделения. Payload
события `updated` несёт новый `editorState`, поэтому читайте из него внутри `fn`
— никакого скрытого `getState`, и `fn` остаётся чистой относительно входа.

## Состояние активного форматирования (bold/italic/…)

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

Обобщите на множество форматов сразу:

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

## Тип текущего блока (заголовок / параграф / список)

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

## Находится ли каретка внутри ссылки?

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

## Выделенный текст

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
