# Адаптеры фреймворков (React, Solid, Vue)

Ядро (`effector-lexical`) не зависит от фреймворка: оно владеет одним
`LexicalEditor` и зеркалит его состояние в стора effector. Адаптер фреймворка
делает лишь одно дополнительное действие — привязывает редактор к
contenteditable DOM-элементу при монтировании и отвязывает при размонтировании.
Реактивность даёт соответствующий биндинг effector
(`effector-react` / `effector-solid` / `effector-vue`), а не адаптер.

```ts
import { createEditorModel } from 'effector-lexical';

export const editor = createEditorModel({
  namespace: 'app',
  onError: console.error,
});
```

## React

У React самый богатый путь, потому что Lexical поставляет `@lexical/react`.
Оберните дерево в `EditorProvider` (он кладёт редактор модели в
`LexicalComposerContext`), затем используйте штатные плагины Lexical.

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

Подробнее об `EditorProvider`, `useEditorModel` и `useEditorInstance` — в
[API React](/ru/api/react).

## Solid

Экосистемы плагинов Lexical для Solid нет, поэтому адаптер — тонкая обёртка над
`setRootElement`. Поведение подключайте фреймворк-независимыми хелперами Lexical
(`registerRichText`, `registerHistory`), а реактивность берите из `useUnit`
пакета `effector-solid`.

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

`editorRef(model)` возвращает `ref`-колбэк, который привязывает редактор при
монтировании элемента и отвязывает через `onCleanup`. Вне реактивного скоупа
используйте императивный вариант:

```ts
import { mountEditor } from 'effector-lexical/solid';

const cleanup = mountEditor(editor, element);
// позже
cleanup();
```

## Vue

Адаптер Vue даёт composable, возвращающий template ref.

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

`useEditorRoot(model)` привязывает элемент в `onMounted` и отвязывает в
`onBeforeUnmount`.

## Подключение rich-text без `@lexical/react`

Для Solid и Vue зарегистрируйте поведение Lexical один раз после создания
редактора:

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

Обе функции возвращают функцию отписки — вызовите их при уничтожении редактора
или дайте `editor.destroy()` снять всё, что зарегистрировала модель.
