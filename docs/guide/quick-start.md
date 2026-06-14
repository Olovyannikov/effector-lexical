# Quick start

## 1. Create a model

The model owns the editor instance — pass the same options you would give to
Lexical's `createEditor`.

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

// Bind a Lexical command to an effector event.
const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
export const formatBold = format.dispatch.prepend(() => 'bold' as const);
```

## 2. Render with React

`<EditorProvider>` replaces `<LexicalComposer>` — the editor already exists, the
provider just injects it into the Lexical React context so the official plugins
work unchanged.

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

## 3. Or go headless

No React required — the core works on its own (great for tests, SSR parsing or
non-React UIs):

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

Next: the full [Core API](../api/core) and [React API](../api/react).
