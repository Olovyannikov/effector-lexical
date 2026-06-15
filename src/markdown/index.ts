import { createEffect, type Effect } from 'effector';
import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
  TRANSFORMERS,
  type Transformer,
} from '@lexical/markdown';

import type { EditorModel } from '../core';

export interface MarkdownApi {
  /** Serializes the current editor content to a Markdown string. */
  readonly exportMarkdownFx: Effect<void, string>;
  /** Replaces the editor content with nodes parsed from a Markdown string. */
  readonly importMarkdownFx: Effect<string, void>;
}

/**
 * Markdown serialization effects for an {@link EditorModel}, backed by
 * `@lexical/markdown`. Import from `effector-lexical/markdown`.
 *
 * Pass custom `transformers` to support the nodes your editor uses; defaults to
 * Lexical's `TRANSFORMERS`.
 */
export function createMarkdownApi(
  model: EditorModel,
  transformers: Array<Transformer> = TRANSFORMERS,
): MarkdownApi {
  const { editor } = model;

  const exportMarkdownFx = createEffect<void, string>(() =>
    editor.read(() => $convertToMarkdownString(transformers)),
  );

  const importMarkdownFx = createEffect<string, void>(
    (markdown) =>
      new Promise<void>((resolve, reject) => {
        try {
          editor.update(
            () => $convertFromMarkdownString(markdown, transformers),
            { onUpdate: resolve },
          );
        } catch (error) {
          reject(error);
        }
      }),
  );

  return { exportMarkdownFx, importMarkdownFx };
}
