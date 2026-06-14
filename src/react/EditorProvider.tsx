import { useMemo, type ReactNode } from 'react';
import {
  createLexicalComposerContext,
  LexicalComposerContext,
  type LexicalComposerContextWithEditor,
} from '@lexical/react/LexicalComposerContext';

import type { EditorModel } from '../core';
import { EditorModelContext } from './context';

export interface EditorProviderProps {
  /** A model created with `createEditorModel`. */
  model: EditorModel;
  children: ReactNode;
}

/**
 * Injects the model's Lexical editor into `LexicalComposerContext` so that
 * standard `@lexical/react` plugins (`RichTextPlugin`, `ContentEditable`,
 * `HistoryPlugin`, …) work, and exposes the model through `useEditorModel`.
 *
 * Use this instead of `<LexicalComposer>` — the editor is already created and
 * owned by the model.
 */
export function EditorProvider({ model, children }: EditorProviderProps) {
  const composerContext = useMemo<LexicalComposerContextWithEditor>(() => {
    const { editor } = model;
    const context = createLexicalComposerContext(null, editor._config.theme);
    return [editor, context];
  }, [model]);

  return (
    <EditorModelContext.Provider value={model}>
      <LexicalComposerContext.Provider value={composerContext}>
        {children}
      </LexicalComposerContext.Provider>
    </EditorModelContext.Provider>
  );
}
