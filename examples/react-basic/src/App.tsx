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

function Footer() {
  const count = useUnit($charCount);
  return <p className="footer">{count} characters</p>;
}

export function App() {
  return (
    <EditorProvider model={editor}>
      <h1>effector-lexical</h1>
      <Toolbar />
      <div className="editor-shell">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">Type here…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
      </div>
      <Footer />
    </EditorProvider>
  );
}
