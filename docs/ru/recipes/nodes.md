# Ноды и контент

## Реакция на мутации нод

`mutations(NodeClass)` превращает листенер мутаций Lexical в событие, чья
полезная нагрузка включает мапу `mutatedNodes` (`NodeKey → 'created' | 'updated'
| 'destroyed'`). Держите сайд-эффект в эффекте и связывайте через `sample` — не
кладите логику в `.watch`.

```ts
import { createEffect, sample } from 'effector';
import { LinkNode } from '@lexical/link';

const linkMutations = editor.mutations(LinkNode);

const trackLinksFx = createEffect(
  (mutatedNodes: Map<NodeKey, NodeMutation>) => {
    for (const [key, kind] of mutatedNodes) {
      if (kind === 'created') analytics.track('link_added', { key });
    }
  },
);

sample({
  clock: linkMutations,
  fn: ({ mutatedNodes }) => mutatedNodes,
  target: trackLinksFx,
});
```

Пропустить первоначальный проход по существующим нодам через
`skipInitialization`:

```ts
const linkMutations = editor.mutations(LinkNode, { skipInitialization: true });
```

## Подсчёт нод определённого типа

Обойдите дерево через `$dfs` из `@lexical/utils` внутри закоммиченного
`editorState` из payload события `updated`.

```ts
import { $dfs } from '@lexical/utils';
import { ImageNode } from './nodes/ImageNode';

const $imageCount = createStore(0);

sample({
  clock: editor.updated,
  fn: ({ editorState }) =>
    editorState.read(
      () => $dfs().filter(({ node }) => node instanceof ImageNode).length,
    ),
  target: $imageCount,
});
```

## Программные правки

`updateFx` оборачивает `editor.update` и резолвится после реконсиляции.

```ts
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

const setContent = (value: string) =>
  editor.updateFx(() => {
    const root = $getRoot();
    root.clear();
    root.append($createParagraphNode().append($createTextNode(value)));
  });
```

Вставка в текущее выделение:

```ts
import { $insertNodes, $createTextNode } from 'lexical';

const insertText = (text: string) =>
  editor.updateFx(() => {
    $insertNodes([$createTextNode(text)]);
  });
```

## Переключение режима только для чтения

Используйте встроенный `setEditableFx`; `$editable` автоматически отражает режим
(`registerEditableListener`).

```ts
const setReadOnly = createEvent<boolean>();

sample({
  clock: setReadOnly,
  fn: (readOnly) => !readOnly,
  target: editor.setEditableFx,
});

// editor.$editable остаётся в синхроне — биндите его в UI через useUnit.
```

## Счётчики символов / слов

```ts
const $chars = editor.$text.map((t) => t.length);
const $words = editor.$text.map((t) =>
  t.trim() ? t.trim().split(/\s+/).length : 0,
);
const $isEmpty = editor.$text.map((t) => t.trim().length === 0);
```

## Ограничение максимальной длины

```ts
const TOO_LONG = sample({
  clock: editor.textChanged,
  filter: (text) => text.length > 280,
});

sample({ clock: TOO_LONG, target: showLimitWarning });
```

## Фокус / потеря фокуса

```ts
const focus = createEvent();
sample({ clock: focus, target: editor.focusFx });
```
