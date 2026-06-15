import { useUnit } from 'effector-react';
import { EditorProvider } from 'effector-lexical/react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { editor, providerFactory, ROOM, $status, $peers } from './model';

function Status() {
  const [status, peers] = useUnit([$status, $peers]);
  return (
    <p className="status">
      <span className={`dot ${status}`} /> {status} · {peers} online
    </p>
  );
}

function CharCount() {
  const text = useUnit(editor.$text);
  return (
    <p className="footer">{text.length} characters (from the $text store)</p>
  );
}

export function App() {
  return (
    <EditorProvider model={editor}>
      <h1>effector-lexical · collaboration</h1>
      <p className="hint">
        Open this page in two tabs/browsers — edits sync in real time.
        Connection status and the peer count come from effector stores.
      </p>
      <Status />
      <div className="editor-shell">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">Type together…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        {/* CollaborationPlugin replaces HistoryPlugin — it owns the document. */}
        <CollaborationPlugin
          id={ROOM}
          providerFactory={providerFactory}
          shouldBootstrap
        />
      </div>
      <CharCount />
    </EditorProvider>
  );
}
