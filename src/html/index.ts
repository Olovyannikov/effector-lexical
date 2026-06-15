import { createEffect, type Effect } from 'effector';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';

import type { EditorModel } from '../core';

export interface HtmlApi {
  /** Serializes the current editor content to an HTML string. */
  readonly exportHtmlFx: Effect<void, string>;
  /** Replaces the editor content with nodes parsed from an HTML string. */
  readonly importHtmlFx: Effect<string, void>;
}

/**
 * HTML serialization effects for an {@link EditorModel}, backed by
 * `@lexical/html`. Import from `effector-lexical/html`.
 */
export function createHtmlApi(model: EditorModel): HtmlApi {
  const { editor } = model;

  const exportHtmlFx = createEffect<void, string>(() =>
    // editor.read provides the active editor context exportDOM needs.
    editor.read(() => $generateHtmlFromNodes(editor, null)),
  );

  const importHtmlFx = createEffect<string, void>(
    (html) =>
      new Promise<void>((resolve, reject) => {
        try {
          editor.update(
            () => {
              const dom = new DOMParser().parseFromString(html, 'text/html');
              const nodes = $generateNodesFromDOM(editor, dom);
              const root = $getRoot();
              root.clear().select();
              $insertNodes(nodes);
            },
            { onUpdate: resolve },
          );
        } catch (error) {
          reject(error);
        }
      }),
  );

  return { exportHtmlFx, importHtmlFx };
}
