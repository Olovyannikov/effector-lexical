# Core API

```ts
import { createEditorModel } from 'effector-lexical';
```

## `createEditorModel(config?)`

Creates a Lexical editor (via `createEditor`) and returns an `EditorModel`
wrapping it with effector units. `config` is forwarded verbatim to
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

### Instance

| Member      | Type                   | Description                                  |
| ----------- | ---------------------- | -------------------------------------------- |
| `editor`    | `LexicalEditor`        | The underlying instance, owned by the model. |
| `$instance` | `Store<LexicalEditor>` | Same instance as a store.                    |

### Events (Lexical listeners → effector)

| Event             | Payload                                  | Source listener               |
| ----------------- | ---------------------------------------- | ----------------------------- |
| `updated`         | `{ editorState, prevEditorState, tags }` | `registerUpdateListener`      |
| `textChanged`     | `string`                                 | `registerTextContentListener` |
| `editableChanged` | `boolean`                                | `registerEditableListener`    |
| `rootChanged`     | `{ rootElement, prevRootElement }`       | `registerRootListener`        |

### Stores (derived state)

| Store       | Type                           | Notes                            |
| ----------- | ------------------------------ | -------------------------------- |
| `$state`    | `Store<EditorState>`           | Latest committed editor state.   |
| `$text`     | `Store<string>`                | Plain-text content.              |
| `$editable` | `Store<boolean>`               | Editable mode.                   |
| `$json`     | `Store<SerializedEditorState>` | `$state.map((s) => s.toJSON())`. |

### Effects (effector → Lexical)

#### `updateFx`

Wraps `editor.update`. Resolves **after** reconciliation (`onUpdate`). Accepts a
writer function, or `{ run, options }` to pass
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

Replaces the editor state. Accepts an `EditorState`, a serialized object, or a
JSON string (parsed via `editor.parseEditorState`).

```ts
await editor.setStateFx(jsonStringFromServer);
```

#### `focusFx` / `blurFx`

`Effect<void, void>` wrapping `editor.focus()` / `editor.blur()`.

### Helpers

#### `read(reader)`

Synchronously reads from the current editor state.

```ts
const text = editor.read(() => $getRoot().getTextContent());
```

#### `command(command, priority?)`

Binds a `LexicalCommand` to effector units. Returns:

- `dispatch: EventCallable<Payload>` — dispatch the command when called.
- `triggered: Event<Payload>` — fires whenever the command is dispatched
  (observation only; the internal handler returns `false` so it never consumes
  the command).

`priority` defaults to `COMMAND_PRIORITY_EDITOR`.

```ts
const bold = editor.command(FORMAT_TEXT_COMMAND);
bold.dispatch('bold'); // dispatch
bold.triggered.watch(console.log); // observe
```

#### `mutations(NodeClass, options?)`

Observes node mutations as an effector event. `options.skipInitialization`
mirrors Lexical's `MutationListenerOptions`.

```ts
editor.mutations(LinkNode).watch(({ mutatedNodes }) => {
  for (const [key, kind] of mutatedNodes) console.log(key, kind);
});
```

#### `destroy()`

Unregisters every Lexical listener created by the model (update, text, editable,
root, every `command` and `mutations` call). Call it when the model is no longer
needed.
