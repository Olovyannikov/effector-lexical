# Ноды и контент

## Реакция на мутации нод

`mutations(NodeClass)` превращает листенер мутаций Lexical в событие, чья
полезная нагрузка включает мапу `mutatedNodes` (`NodeKey → 'created' | 'updated'
| 'destroyed'`).

```ts
import { LinkNode } from '@lexical/link';

editor.mutations(LinkNode).watch(({ mutatedNodes }) => {
  for (const [key, kind] of mutatedNodes) {
    if (kind === 'created') analytics.track('link_added', { key });
  }
});
```

Пропустить первоначальный проход по существующим нодам:

```ts
editor.mutations(LinkNode, { skipInitialization: true }).watch(/* … */);
```

## Подсчёт нод определённого типа

```ts
import { ImageNode } from './nodes/ImageNode';

const $imageCount = createStore(0);

sample({
  clock: editor.updated,
  fn: () => editor.read(() => $nodesOfType(ImageNode).length),
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

`$editable` автоматически отражает режим (`registerEditableListener`);
переключайте его через эффект.

```ts
const setEditable = createEvent<boolean>();
const setEditableFx = createEffect((editable: boolean) =>
  editor.editor.setEditable(editable),
);
sample({ clock: setEditable, target: setEditableFx });
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
