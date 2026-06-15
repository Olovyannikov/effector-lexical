import { createEffect, type Effect } from 'effector';
import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
  TRANSFORMERS,
  type Transformer,
} from '@lexical/markdown';
import {
  createEditor,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type Klass,
  type LexicalNode,
  type SerializedLexicalNode,
} from 'lexical';

import type {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
  $insertGeneratedNodes,
} from '@lexical/clipboard';

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

/** Heuristic: does this text look like Markdown worth converting? */
const MARKDOWN_HINT =
  /(^|\n)\s{0,3}(#{1,6} |[-*+] |\d+\. |> |```|(?:-{3,}|\*{3,}|_{3,})\s*$)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`/;

export const markdownLooksLike = (text: string): boolean =>
  MARKDOWN_HINT.test(text);

const nodesFromTransformers = (
  transformers: Array<Transformer>,
): Array<Klass<LexicalNode>> => {
  const set = new Set<Klass<LexicalNode>>();
  for (const transformer of transformers) {
    const deps = (
      transformer as { dependencies?: ReadonlyArray<Klass<LexicalNode>> }
    ).dependencies;
    if (deps) for (const dep of deps) set.add(dep);
  }
  return [...set];
};

export interface MarkdownPasteOptions {
  /** Transformers used for parsing; defaults to Lexical's `TRANSFORMERS`. */
  transformers?: Array<Transformer>;
  /** Decides whether pasted text should be treated as Markdown. */
  match?: (text: string) => boolean;
}

interface ClipboardModule {
  $generateJSONFromSelectedNodes: typeof $generateJSONFromSelectedNodes;
  $generateNodesFromSerializedNodes: typeof $generateNodesFromSerializedNodes;
  $insertGeneratedNodes: typeof $insertGeneratedNodes;
}

/**
 * Converts pasted Markdown into nodes at the caret (instead of the whole-doc
 * replace that `importMarkdownFx` does). Intercepts `PASTE_COMMAND`; when the
 * clipboard text passes `match`, it builds nodes in a throwaway editor and
 * inserts them at the selection. Requires the optional `@lexical/clipboard`
 * peer (loaded lazily). Returns a cleanup.
 */
export function registerMarkdownPaste(
  model: EditorModel,
  options: MarkdownPasteOptions = {},
): () => void {
  const { transformers = TRANSFORMERS, match = markdownLooksLike } = options;
  const { editor } = model;
  const nodes = nodesFromTransformers(transformers);

  let disposed = false;
  let unregister: (() => void) | null = null;

  const serialize = (clip: ClipboardModule, md: string) => {
    const temp = createEditor({
      nodes,
      onError: (error) => {
        throw error;
      },
    });
    let result: Array<SerializedLexicalNode> = [];
    temp.update(
      () => {
        $convertFromMarkdownString(md, transformers);
        const root = $getRoot();
        result = clip.$generateJSONFromSelectedNodes(
          temp,
          root.select(0, root.getChildrenSize()),
        ).nodes;
      },
      { discrete: true },
    );
    return result;
  };

  // @lexical/clipboard is an optional peer — load it lazily so importing this
  // module without it (for export/import only) keeps working.
  void import('@lexical/clipboard').then((clip) => {
    if (disposed) return;
    unregister = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false;
        const text = event.clipboardData?.getData('text/plain') ?? '';
        if (!text || !match(text)) return false;
        event.preventDefault();
        const serialized = serialize(clip, text);
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          clip.$insertGeneratedNodes(
            editor,
            clip.$generateNodesFromSerializedNodes(serialized),
            selection,
          );
        });
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  });

  return () => {
    disposed = true;
    unregister?.();
  };
}
