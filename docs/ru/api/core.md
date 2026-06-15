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

| Стор         | Тип                                | Примечания                                                                                  |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `$state`     | `Store<EditorState>`               | Последнее зафиксированное состояние редактора.                                              |
| `$text`      | `Store<string>`                    | Содержимое в виде простого текста.                                                          |
| `$editable`  | `Store<boolean>`                   | Режим редактирования.                                                                       |
| `$json`      | `Store<SerializedEditorState>`     | `$state.map((s) => s.toJSON())`.                                                            |
| `$selection` | `Store<SelectionSnapshot \| null>` | Снимок `{ isCollapsed, isBackward, text }`; `null`, когда выделение не является диапазоном. |

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

#### `setEditableFx`

`Effect<boolean, void>`, оборачивающий `editor.setEditable()`. `$editable` обновляется через
листенер editable.

```ts
await editor.setEditableFx(false); // read-only
```

#### `focusFx` / `blurFx`

`Effect<void, void>`, оборачивающий `editor.focus()` / `editor.blur()`.

### Хелперы

#### `read(reader)`

Синхронно читает из текущего состояния редактора.

```ts
const text = editor.read(() => $getRoot().getTextContent());
```

#### `attachToScope(scope)` / `detachScope()`

Привязывает каждую эмиссию, управляемую листенерами, к форкнутому scope effector (через
`scopeBind`), так что сторы модели и события `command`/`mutations` обновляют этот
scope вместо глобального. Вызывайте один раз после `fork()`; `detachScope()`
возвращает к глобальному scope. См. [Scope, SSR и тестирование](../recipes/scope).

```ts
import { fork } from 'effector';

const scope = fork();
editor.attachToScope(scope);
// теперь scope.getState(editor.$text) отслеживает правки
```

#### `history()`

Возвращает юниты истории, опирающиеся на команды истории Lexical. Требует активного
плагина истории (`<HistoryPlugin />` или `registerHistory`).

```ts
const { $canUndo, $canRedo, undo, redo } = editor.history();
```

| Член       | Тип                   | Описание                        |
| ---------- | --------------------- | ------------------------------- |
| `$canUndo` | `Store<boolean>`      | Зеркалирует `CAN_UNDO_COMMAND`. |
| `$canRedo` | `Store<boolean>`      | Зеркалирует `CAN_REDO_COMMAND`. |
| `undo`     | `EventCallable<void>` | Диспатчит `UNDO_COMMAND`.       |
| `redo`     | `EventCallable<void>` | Диспатчит `REDO_COMMAND`.       |

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

#### `nodeTransform(NodeClass, transform)`

Регистрирует [преобразование узла](https://lexical.dev/docs/concepts/transforms) (выполняется
внутри обновлений для нормализации узлов) и отслеживает его для `destroy()`. Возвращает
функцию отмены регистрации.

```ts
editor.nodeTransform(TextNode, (node) => {
  // например, схлопнуть двойные пробелы, автоссылки и т. д.
});
```

#### `destroy()`

Отменяет регистрацию каждого листенера Lexical, созданного моделью (update, text, editable,
root, каждый вызов `command` и `mutations`). Вызывайте, когда модель больше не
нужна.
