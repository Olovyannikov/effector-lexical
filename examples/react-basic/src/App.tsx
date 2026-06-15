import { useUnit } from 'effector-react';
import { EditorProvider, useEditorInstance } from 'effector-lexical/react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TreeView } from '@lexical/react/LexicalTreeView';

import {
  editor,
  formatBold,
  formatItalic,
  undo,
  redo,
  $charCount,
  toggleDebug,
  $debug,
} from './model';

function Toolbar() {
  const [onBold, onItalic, onUndo, onRedo, onToggleDebug, debug] = useUnit([
    formatBold,
    formatItalic,
    undo,
    redo,
    toggleDebug,
    $debug,
  ]);
  return (
    <div className="toolbar">
      <button onClick={() => onBold()}>Bold</button>
      <button onClick={() => onItalic()}>Italic</button>
      <button onClick={() => onUndo()}>Undo</button>
      <button onClick={() => onRedo()}>Redo</button>
      <button onClick={() => onToggleDebug()}>
        {debug ? 'Hide' : 'Show'} tree
      </button>
    </div>
  );
}

// Devtools: Lexical's editor-state inspector with time travel.
function TreeViewPlugin() {
  const lexicalEditor = useEditorInstance();
  return (
    <TreeView
      editor={lexicalEditor}
      viewClassName="tree-view-output"
      treeTypeButtonClassName="debug-treetype-button"
      timeTravelButtonClassName="debug-timetravel-button"
      timeTravelPanelClassName="debug-timetravel-panel"
      timeTravelPanelButtonClassName="debug-timetravel-panel-button"
      timeTravelPanelSliderClassName="debug-timetravel-panel-slider"
    />
  );
}

function Footer() {
  const count = useUnit($charCount);
  return <p className="footer">{count} characters</p>;
}

export function App() {
  const debug = useUnit($debug);
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
      {debug && (
        <div className="tree-view">
          <TreeViewPlugin />
        </div>
      )}
    </EditorProvider>
  );
}
