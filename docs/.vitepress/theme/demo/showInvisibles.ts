// "Show invisibles": render a · for every space.
//
// The marker is a distinct NODE TYPE (not a format/style), because Lexical
// inherits a text node's format/style onto newly typed text — that's what made
// an earlier style-based attempt render typed text invisible. A node type is
// never inherited: typing produces a plain TextNode, so new text stays visible.
//
// Note on line breaks: we deliberately do NOT mark soft line breaks (↵). The
// only way to show a glyph there is to wrap the <br> in an element, which breaks
// Lexical's caret mapping (you can't type before the break). Paragraph ends are
// covered by a CSS-only ¶ instead.

import {
  TextNode,
  $createTextNode,
  $getRoot,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type SerializedTextNode,
} from 'lexical';

/** A single whitespace character, rendered as a span we can mark with CSS. */
export class WhitespaceNode extends TextNode {
  static getType(): string {
    return 'whitespace';
  }

  static clone(node: WhitespaceNode): WhitespaceNode {
    return new WhitespaceNode(node.__text, node.__key);
  }

  static importJSON(json: SerializedTextNode): WhitespaceNode {
    return new WhitespaceNode(json.text);
  }

  exportJSON(): SerializedTextNode {
    return { ...super.exportJSON(), type: 'whitespace' };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add('ws-mark');
    return dom;
  }

  updateDOM(
    prev: WhitespaceNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const updated = super.updateDOM(prev, dom, config);
    dom.classList.add('ws-mark');
    return updated;
  }

  // Keep the node a single space: typed text goes to sibling plain TextNodes,
  // never inside the marker (which would render it invisible).
  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export const SHOW_INVISIBLES_NODES = [WhitespaceNode];

const WHITESPACE = /\s/;

/**
 * Registers transforms that convert each space into a `WhitespaceNode` while
 * `isOn()` is true, and revert them otherwise. Returns a cleanup.
 */
export function registerShowInvisibles(
  editor: LexicalEditor,
  isOn: () => boolean,
): () => void {
  const unregister = [
    // text → split off one whitespace char into a WhitespaceNode
    editor.registerNodeTransform(TextNode, (node) => {
      if (!isOn() || node instanceof WhitespaceNode) return;
      const text = node.getTextContent();
      const at = text.search(WHITESPACE);
      if (at < 0) return;
      const fromAt = at > 0 ? node.splitText(at)[1]! : node;
      const one =
        fromAt.getTextContent().length > 1 ? fromAt.splitText(1)[0]! : fromAt;
      one.replace(new WhitespaceNode(one.getTextContent()));
    }),
    // whitespace → back to plain text when off (then it merges naturally)
    editor.registerNodeTransform(WhitespaceNode, (node) => {
      if (isOn()) return;
      node.replace($createTextNode(node.getTextContent()));
    }),
  ];
  return () => unregister.forEach((fn) => fn());
}

/** Re-processes existing content after the toggle changes. */
export function refreshInvisibles(editor: LexicalEditor): void {
  editor.update(() => {
    const walk = (node: LexicalNode) => {
      if (node instanceof TextNode) node.markDirty();
      if ('getChildren' in node) {
        for (const child of (
          node as { getChildren(): LexicalNode[] }
        ).getChildren())
          walk(child);
      }
    };
    walk($getRoot());
  });
}
