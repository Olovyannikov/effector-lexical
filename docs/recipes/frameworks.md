# Framework adapters (React, Solid, Vue)

The core (`effector-lexical`) is framework-agnostic: it owns a single
`LexicalEditor` and mirrors its state into effector stores. A framework adapter
does only one extra thing — bind that editor to a contenteditable DOM element on
mount and unbind it on unmount. Reactivity comes from the matching effector
binding (`effector-react` / `effector-solid` / `effector-vue`), not from the
adapter.

```ts
import { createEditorModel } from 'effector-lexical';

export const editor = createEditorModel({
  namespace: 'app',
  onError: console.error,
});
```

## React

React has the richest path because Lexical ships `@lexical/react`. Wrap your tree
in `EditorProvider` (it injects the model's editor into `LexicalComposerContext`),
then use Lexical's own plugins.

```tsx
import { useUnit } from 'effector-react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { EditorProvider } from 'effector-lexical/react';

import { editor } from './model';

function Text() {
  const text = useUnit(editor.$text);
  return <p>{text}</p>;
}

export function App() {
  return (
    <EditorProvider model={editor}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <Text />
    </EditorProvider>
  );
}
```

See the [React API](/api/react) for `EditorProvider`, `useEditorModel` and
`useEditorInstance`.

## Solid

There is no Lexical plugin ecosystem for Solid, so the adapter is a thin
`setRootElement` binder. Use Lexical's framework-agnostic helpers
(`registerRichText`, `registerHistory`) for behaviour and `effector-solid`'s
`useUnit` for reactivity.

```tsx
import { useUnit } from 'effector-solid';
import { editorRef } from 'effector-lexical/solid';

import { editor } from './model';

export function App() {
  const text = useUnit(editor.$text);
  return (
    <>
      <div contenteditable ref={editorRef(editor)} />
      <p>{text()}</p>
    </>
  );
}
```

`editorRef(model)` returns a `ref` callback that binds on attach and unbinds via
`onCleanup`. Outside a reactive scope use the imperative variant:

```ts
import { mountEditor } from 'effector-lexical/solid';

const cleanup = mountEditor(editor, element);
// later
cleanup();
```

## Vue

The Vue adapter exposes a composable that returns a template ref.

```vue
<script setup>
import { useUnit } from 'effector-vue';
import { useEditorRoot } from 'effector-lexical/vue';

import { editor } from './model';

const root = useEditorRoot(editor);
const text = useUnit(editor.$text);
</script>

<template>
  <div contenteditable :ref="root" />
  <p>{{ text }}</p>
</template>
```

`useEditorRoot(model)` binds the element in `onMounted` and unbinds in
`onBeforeUnmount`.

## Wiring rich-text behaviour without `@lexical/react`

For Solid and Vue, register Lexical's behaviour once after the editor exists:

```ts
import { registerRichText } from '@lexical/rich-text';
import { registerHistory, createEmptyHistoryState } from '@lexical/history';

const teardownRichText = registerRichText(editor.editor);
const teardownHistory = registerHistory(
  editor.editor,
  createEmptyHistoryState(),
  300,
);
```

Both functions return an unsubscribe — call them when the editor is destroyed, or
let `editor.destroy()` tear down everything the model registered.
