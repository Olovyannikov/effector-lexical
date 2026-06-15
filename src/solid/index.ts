import { onCleanup } from 'solid-js';

import type { EditorModel } from '../core';

/**
 * A Solid `ref` callback that binds the model's Lexical editor to a
 * contenteditable element (and unbinds it on cleanup).
 *
 * ```tsx
 * import { editorRef } from 'effector-lexical/solid';
 * <div contenteditable ref={editorRef(editor)} />;
 * ```
 *
 * The core is framework-agnostic, so reactivity comes from `effector-solid`
 * (`useUnit`) and rich-text behaviour from Lexical's own `registerRichText` /
 * `registerHistory`.
 */
export function editorRef(model: EditorModel) {
  return (element: HTMLElement) => {
    model.editor.setRootElement(element);
    onCleanup(() => model.editor.setRootElement(null));
  };
}

/**
 * Imperative variant: bind the editor to an element and get a cleanup back.
 * Useful outside a component's reactive scope.
 */
export function mountEditor(
  model: EditorModel,
  element: HTMLElement,
): () => void {
  model.editor.setRootElement(element);
  return () => model.editor.setRootElement(null);
}
