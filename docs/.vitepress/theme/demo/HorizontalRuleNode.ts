// Minimal, self-contained horizontal-rule node — renders an <hr>.
// We define our own instead of @lexical/react's (deprecated in 0.45 in favour
// of @lexical/extension) to avoid the extra dependency and the warning.
// On the new extension API (lexical 0.46+) prefer @lexical/extension's
// HorizontalRuleExtension via editor.registerExtension(...).
import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type SerializedLexicalNode,
} from 'lexical';

export class HorizontalRuleNode extends DecoratorNode<null> {
  static getType(): string {
    return 'horizontalrule';
  }

  static clone(node: HorizontalRuleNode): HorizontalRuleNode {
    return new HorizontalRuleNode(node.__key);
  }

  static importJSON(): HorizontalRuleNode {
    return $createHorizontalRuleNode();
  }

  // Recognise <hr> from pasted / imported HTML.
  static importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({
        conversion: () => ({ node: $createHorizontalRuleNode() }),
        priority: 0,
      }),
    };
  }

  exportJSON(): SerializedLexicalNode {
    return { type: 'horizontalrule', version: 1 };
  }

  exportDOM(): DOMExportOutput {
    return { element: document.createElement('hr') };
  }

  createDOM(): HTMLElement {
    return document.createElement('hr');
  }

  getTextContent(): string {
    return '\n';
  }

  isInline(): boolean {
    return false;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): null {
    return null;
  }
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return new HorizontalRuleNode();
}

export function $isHorizontalRuleNode(
  node: LexicalNode | null | undefined,
): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode;
}
