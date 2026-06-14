# Core API

```ts
import { createEditorModel } from 'effector-lexical';
```

## `createEditorModel(config?)`

Создаёт редактор Lexical (через `createEditor`) и возвращает `EditorModel`,
оборачивающую его юнитами effector. `config` передаётся без изменений в
`createEditor` (`namespace`, `nodes`, `theme`, `onError`, `editable`,
`editorState`, …).

```ts
const editor = createEditorModel({
  namespace: 'app',
  nodes: [HeadingNode, QuoteNode],
  onError: (e) => console.error(e),
});
```

## `EditorModel`

### Экземпляр

| Член        | Тип                    | Описание                                 |
| ----------- | ---------------------- | ---------------------------------------- |
| `editor`    | `LexicalEditor`        | Базовый экземпляр, принадлежащий модели. |
| `$instance` | `Store<LexicalEditor>` | Тот же экземпляр в виде стора.           |

### События (листенеры Lexical → effector)

| Событие           | Полезная нагрузка                        | Исходный листенер             |
| ----------------- | ---------------------------------------- | ----------------------------- |
| `updated`         | `{ editorState, prevEditorState, tags }` | `registerUpdateListener`      |
| `textChanged`     | `string`                                 | `registerTextContentListener` |
| `editableChanged` | `boolean`                                | `registerEditableListener`    |
| `rootChanged`     | `{ rootElement, prevRootElement }`       | `registerRootListener`        |

### Сторы (производное состояние)

| Стор        | Тип                            | Примечания                                     |
| ----------- | ------------------------------ | ---------------------------------------------- |
| `$state`    | `Store<EditorState>`           | Последнее зафиксированное состояние редактора. |
| `$text`     | `Store<string>`                | Содержимое в виде простого текста.             |
| `$editable` | `Store<boolean>`               | Режим редактирования.                          |
| `$json`     | `Store<SerializedEditorState>` | `$state.map((s) => s.toJSON())`.               |

### Эффекты (effector → Lexical)

#### `updateFx`

Оборачивает `editor.update`. Резолвится **после** реконсиляции (`onUpdate`). Принимает
функцию-писатель или `{ run, options }` для передачи
[`EditorUpdateOptions`](https://lexical.dev/docs/api/type-aliases/EditorUpdateOptions).

```ts
await editor.updateFx(() => {
  $getRoot().selectEnd();
});

await editor.updateFx({
  run: () => {
    /* … */
  },
  options: { tag: 'history-merge', discrete: true },
});
```

#### `setStateFx`

Заменяет состояние редактора. Принимает `EditorState`, сериализованный объект или
JSON-строку (парсится через `editor.parseEditorState`).

```ts
await editor.setStateFx(jsonStringFromServer);
```

#### `focusFx` / `blurFx`

`Effect<void, void>`, оборачивающий `editor.focus()` / `editor.blur()`.

### Хелперы

#### `read(reader)`

Синхронно читает из текущего состояния редактора.

```ts
const text = editor.read(() => $getRoot().getTextContent());
```

#### `command(command, priority?)`

Привязывает `LexicalCommand` к юнитам effector. Возвращает:

- `dispatch: EventCallable<Payload>` — диспатчит команду при вызове.
- `triggered: Event<Payload>` — срабатывает каждый раз, когда команда диспатчится
  (только наблюдение; внутренний обработчик возвращает `false`, поэтому никогда не потребляет
  команду).

`priority` по умолчанию равен `COMMAND_PRIORITY_EDITOR`.

```ts
const bold = editor.command(FORMAT_TEXT_COMMAND);
bold.dispatch('bold'); // dispatch
bold.triggered.watch(console.log); // observe
```

#### `mutations(NodeClass, options?)`

Наблюдает мутации узлов как событие effector. `options.skipInitialization`
зеркалирует `MutationListenerOptions` из Lexical.

```ts
editor.mutations(LinkNode).watch(({ mutatedNodes }) => {
  for (const [key, kind] of mutatedNodes) console.log(key, kind);
});
```

#### `destroy()`

Отменяет регистрацию каждого листенера Lexical, созданного моделью (update, text, editable,
root, каждый вызов `command` и `mutations`). Вызывайте, когда модель больше не
нужна.
