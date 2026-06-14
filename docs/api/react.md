# React API

```ts
import {
  EditorProvider,
  useEditorModel,
  useEditorInstance,
} from 'effector-lexical/react';
```

The React layer is intentionally thin. The model already owns the editor, so the
provider's only job is to inject that editor into `LexicalComposerContext` —
which makes every standard `@lexical/react` plugin (`RichTextPlugin`,
`PlainTextPlugin`, `ContentEditable`, `HistoryPlugin`, `ListPlugin`, …) work
unchanged.

## `<EditorProvider model>`

Use it **instead of** `<LexicalComposer>`.

| Prop       | Type          | Description                       |
| ---------- | ------------- | --------------------------------- |
| `model`    | `EditorModel` | A model from `createEditorModel`. |
| `children` | `ReactNode`   | Lexical plugins and your UI.      |

```tsx
<EditorProvider model={editor}>
  <RichTextPlugin
    contentEditable={<ContentEditable />}
    placeholder={<div>Type…</div>}
    ErrorBoundary={LexicalErrorBoundary}
  />
  <HistoryPlugin />
</EditorProvider>
```

The theme passed to `createEditorModel` is forwarded into the composer context,
so theme-based class names work the same as with `LexicalComposer`.

## `useEditorModel()`

Returns the `EditorModel` from the nearest provider. Throws if used outside an
`<EditorProvider>`.

```tsx
function CharCount() {
  const { $text } = useEditorModel();
  return <span>{useUnit($text).length}</span>;
}
```

## `useEditorInstance()`

Shortcut for `useEditorModel().editor` — the raw `LexicalEditor`, handy when a
third-party plugin expects the instance directly.

::: tip Reading stores
This package does not bundle `effector-react`. Read stores with `useUnit` from
`effector-react`, or subscribe manually with `store.watch`.
:::
