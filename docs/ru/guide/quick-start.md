# Быстрый старт

## 1. Создайте модель

Модель владеет экземпляром редактора — передайте те же опции, что вы передали бы
в `createEditor` из Lexical.

```ts
// model.ts
import { createEditorModel } from 'effector-lexical';
import { FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical';

export const editor = createEditorModel({
  namespace: 'my-editor',
  onError: (error) => {
    throw error;
  },
});

// Привязываем команду Lexical к событию effector.
const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
export const formatBold = format.dispatch.prepend(() => 'bold' as const);
```

## 2. Рендеринг с React

`<EditorProvider>` заменяет `<LexicalComposer>` — редактор уже существует, провайдер
просто внедряет его в React-контекст Lexical, чтобы официальные плагины
работали без изменений.

```tsx
// App.tsx
import { useUnit } from 'effector-react';
import { EditorProvider } from 'effector-lexical/react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { editor, formatBold } from './model';

export function App() {
  const onBold = useUnit(formatBold);
  const text = useUnit(editor.$text);

  return (
    <EditorProvider model={editor}>
      <button onClick={() => onBold()}>Bold</button>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div>Type here…</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <p>{text.length} characters</p>
    </EditorProvider>
  );
}
```

## 3. Или в headless-режиме

React не требуется — ядро работает само по себе (отлично подходит для тестов, парсинга при SSR
или не-React UI):

```ts
import { createEditorModel } from 'effector-lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

const editor = createEditorModel({
  namespace: 'headless',
  onError: console.error,
});

editor.$text.watch((text) => console.log('text:', text));

await editor.updateFx(() => {
  const root = $getRoot();
  root.clear();
  root.append($createParagraphNode().append($createTextNode('hello')));
});
// → "text: hello"
```

Далее: полный [Core API](../api/core) и [React API](../api/react).
