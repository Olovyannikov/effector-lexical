import { createContext, useContext } from 'react';

import type { EditorModel } from '../core';

export const EditorModelContext = createContext<EditorModel | null>(null);

/** Returns the {@link EditorModel} provided by the nearest `<EditorProvider>`. */
export function useEditorModel(): EditorModel {
  const model = useContext(EditorModelContext);
  if (model === null) {
    throw new Error('useEditorModel must be used within an <EditorProvider>.');
  }
  return model;
}

/** Returns the underlying Lexical editor instance from the nearest provider. */
export function useEditorInstance() {
  return useEditorModel().editor;
}
