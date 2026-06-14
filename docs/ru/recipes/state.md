# Синхронизация состояния

## Автосохранение (с дебаунсом) на сервер

`updated` срабатывает на каждый коммит. Засэмплите его в эффект с дебаунсом,
взяв сериализованное состояние из `$json`.

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

Нет `patronum`? Замените `debounce(editor.updated, 800)` своим собственным
событием с дебаунсом.

## Сохранять только при реальных изменениях контента

`updated` срабатывает и при изменениях, затрагивающих только выделение.
Используйте `textChanged` (или сравнивайте `$json`) как фильтр, когда вам важен
только контент:

```ts
sample({
  clock: debounce(editor.textChanged, 800),
  source: editor.$json,
  target: saveFx,
});
```

## Загрузка документа с сервера

`setStateFx` принимает JSON-строку, поэтому fetch, возвращающий
сериализованное состояние, подключается напрямую.

```ts
const loadFx = createEffect((id: string) =>
  fetch(`/api/doc/${id}`).then((r) => r.text()),
);

sample({ clock: loadFx.doneData, target: editor.setStateFx });
```

## Сохранение в localStorage и восстановление при загрузке

```ts
const persistFx = createEffect((json: unknown) =>
  localStorage.setItem('doc', JSON.stringify(json)),
);

sample({ clock: editor.$json, target: persistFx });

const saved = localStorage.getItem('doc');
if (saved) editor.setStateFx(saved);
```

## Индикатор изменений / сохранения

Отслеживайте, отличается ли текущий контент от последнего сохранённого
снимка.

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

## Сброс к пустому документу

```ts
import { $getRoot } from 'lexical';

const clearFx = attach({
  effect: editor.updateFx,
  mapParams: () => () => {
    $getRoot().clear();
  },
});
```

## Экспорт текущего контента

`read` выполняется синхронно относительно последнего состояния — удобно для
кнопок экспорта.

```ts
import { $generateHtmlFromNodes } from '@lexical/html';

const exportHtml = () =>
  editor.read(() => $generateHtmlFromNodes(editor.editor, null));

const exportJson = () => editor.$json.getState();
```
