# Examples

## Runnable example

A complete React app lives in
[`examples/react-basic`](https://github.com/Olovyannikov/effector-lexical/tree/main/examples/react-basic):

```bash
pnpm install
pnpm --filter @example/react-basic dev
```

It demonstrates a rich-text editor with a bound toolbar (bold/italic/undo/redo),
history and a live character counter wired through effector stores.

## Full model + UI

### `model.ts`

```ts
import { createEditorModel } from 'effector-lexical';
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  type TextFormatType,
} from 'lexical';

export const editor = createEditorModel({
  namespace: 'react-basic',
  theme: { text: { bold: 'editor-bold', italic: 'editor-italic' } },
  onError: (error) => {
    throw error;
  },
});

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
export const formatBold = format.dispatch.prepend(() => 'bold' as const);
export const formatItalic = format.dispatch.prepend(() => 'italic' as const);

export const undo = editor.command<void>(UNDO_COMMAND).dispatch;
export const redo = editor.command<void>(REDO_COMMAND).dispatch;

export const $charCount = editor.$text.map((text) => text.length);
```

### `App.tsx`

```tsx
import { useUnit } from 'effector-react';
import { EditorProvider } from 'effector-lexical/react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import {
  editor,
  formatBold,
  formatItalic,
  undo,
  redo,
  $charCount,
} from './model';

function Toolbar() {
  const [onBold, onItalic, onUndo, onRedo] = useUnit([
    formatBold,
    formatItalic,
    undo,
    redo,
  ]);
  return (
    <div className="toolbar">
      <button onClick={() => onBold()}>Bold</button>
      <button onClick={() => onItalic()}>Italic</button>
      <button onClick={() => onUndo()}>Undo</button>
      <button onClick={() => onRedo()}>Redo</button>
    </div>
  );
}

export function App() {
  const count = useUnit($charCount);
  return (
    <EditorProvider model={editor}>
      <Toolbar />
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={<div className="editor-placeholder">Type here…</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <p>{count} characters</p>
    </EditorProvider>
  );
}
```

## Headless (no React)

```ts
import { createEditorModel } from 'effector-lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

const editor = createEditorModel({ namespace: 'cli', onError: console.error });

editor.$json.watch((json) => console.log(JSON.stringify(json)));

await editor.updateFx(() => {
  const root = $getRoot();
  root.clear();
  root.append(
    $createParagraphNode().append($createTextNode('Generated server-side')),
  );
});

editor.destroy();
```

## Devtools

The [`react-basic`](https://github.com/Olovyannikov/effector-lexical/tree/main/examples/react-basic)
example has a **Show tree** button that mounts Lexical's `TreeView` (the
editor-state inspector with time travel), gated by an effector store:

```tsx
import { TreeView } from '@lexical/react/LexicalTreeView';
import { useEditorInstance } from 'effector-lexical/react';

function TreeViewPlugin() {
  return (
    <TreeView editor={useEditorInstance()} viewClassName="tree-view-output" />
  );
}

// model.ts
export const toggleDebug = createEvent();
export const $debug = createStore(false).on(toggleDebug, (on) => !on);
```

For ad-hoc debugging of any page, the official **Lexical DevTools** browser
extension inspects live editors without any code.
