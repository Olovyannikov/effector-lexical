// "Show invisibles" via dedicated node types.
//
// The marker is encoded as a distinct NODE TYPE (not a format/style), because
// Lexical inherits a text node's format/style onto newly typed text — which is
// exactly what made an earlier style-based attempt render typed text invisible.
// A node type is never inherited: typing produces a plain TextNode, so new text
// stays visible.

import {
  TextNode,
  LineBreakNode,
  $createTextNode,
  $getRoot,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type SerializedLineBreakNode,
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

/** A line break that also shows a ↵ marker before the break. */
export class LineBreakMarkNode extends LineBreakNode {
  static getType(): string {
    return 'linebreak-mark';
  }

  static clone(node: LineBreakMarkNode): LineBreakMarkNode {
    return new LineBreakMarkNode(node.__key);
  }

  static importJSON(): LineBreakMarkNode {
    return new LineBreakMarkNode();
  }

  exportJSON(): SerializedLineBreakNode {
    return { ...super.exportJSON(), type: 'linebreak-mark' };
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'lb-mark';
    span.appendChild(document.createElement('br'));
    return span;
  }
}

export const SHOW_INVISIBLES_NODES = [WhitespaceNode, LineBreakMarkNode];

const WHITESPACE = /\s/;

/**
 * Registers transforms that convert whitespace/line breaks into their marker
 * node types while `isOn()` is true, and revert them otherwise. Returns a
 * cleanup that unregisters everything.
 */
export function registerShowInvisibles(
  editor: LexicalEditor,
  isOn: () => boolean,
): () => void {
  const unregister = [
    // text → split off one whitespace char into a WhitespaceNode
    editor.registerNodeTransform(TextNode, (node) => {
      if (!isOn()) return;
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
    // line break → marked line break when on
    editor.registerNodeTransform(LineBreakNode, (node) => {
      if (!isOn() || node instanceof LineBreakMarkNode) return;
      node.replace(new LineBreakMarkNode());
    }),
    // marked line break → plain line break when off
    editor.registerNodeTransform(LineBreakMarkNode, (node) => {
      if (isOn()) return;
      node.replace(new LineBreakNode());
    }),
  ];
  return () => unregister.forEach((fn) => fn());
}

/** Re-processes existing content after the toggle changes. */
export function refreshInvisibles(editor: LexicalEditor): void {
  editor.update(() => {
    const walk = (node: LexicalNode) => {
      if (node instanceof TextNode || node instanceof LineBreakNode) {
        node.markDirty();
      }
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
