import { useUnit } from 'effector-react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical';

import { createEditorModel } from '../../../../src';
import { EditorProvider } from '../../../../src/react';

const editor = createEditorModel({
  namespace: 'docs-demo',
  theme: { text: { bold: 'demo-bold', italic: 'demo-italic' } },
  onError: (error) => {
    throw error;
  },
});

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
const bold = format.dispatch.prepend(() => 'bold' as const);
const italic = format.dispatch.prepend(() => 'italic' as const);
const { $canUndo, $canRedo, undo, redo } = editor.history();
const $chars = editor.$text.map((t) => t.length);

// Platform-aware shortcut hints for tooltips.
const IS_APPLE =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
const sc = (key: string) => (IS_APPLE ? `⌘${key}` : `Ctrl+${key}`);
const REDO_HINT = IS_APPLE ? '⇧⌘Z' : 'Ctrl+Shift+Z';

function Toolbar() {
  const [onBold, onItalic, onUndo, onRedo, canUndo, canRedo] = useUnit([
    bold,
    italic,
    undo,
    redo,
    $canUndo,
    $canRedo,
  ]);
  return (
    <div className="demo-toolbar">
      <button title={`Bold (${sc('B')})`} onClick={() => onBold()}>
        <b>B</b>
      </button>
      <button title={`Italic (${sc('I')})`} onClick={() => onItalic()}>
        <i>I</i>
      </button>
      <span className="demo-sep" />
      <button
        title={`Undo (${sc('Z')})`}
        onClick={() => onUndo()}
        disabled={!canUndo}
      >
        ↶ Undo
      </button>
      <button
        title={`Redo (${REDO_HINT})`}
        onClick={() => onRedo()}
        disabled={!canRedo}
      >
        ↷ Redo
      </button>
    </div>
  );
}

function Counter() {
  const chars = useUnit($chars);
  return (
    <p className="demo-footer">
      {chars} characters · state lives in effector stores
    </p>
  );
}

export function EditorDemo() {
  return (
    <EditorProvider model={editor}>
      <div className="demo-shell">
        <Toolbar />
        <div className="demo-input-wrap">
          <RichTextPlugin
            contentEditable={<ContentEditable className="demo-input" />}
            placeholder={
              <div className="demo-placeholder">Type something…</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
        </div>
        <Counter />
      </div>
    </EditorProvider>
  );
}
