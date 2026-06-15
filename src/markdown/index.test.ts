import { describe, it, expect } from 'vitest';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import {
  TRANSFORMERS,
  $convertFromMarkdownString,
  $convertToMarkdownString,
  type ElementTransformer,
} from '@lexical/markdown';
import {
  $getRoot,
  DecoratorNode,
  type LexicalNode,
  type SerializedLexicalNode,
} from 'lexical';

// Minimal horizontal-rule node for the test (avoids @lexical/react's deprecated one).
class HorizontalRuleNode extends DecoratorNode<null> {
  static getType() {
    return 'horizontalrule';
  }
  static clone(node: HorizontalRuleNode) {
    return new HorizontalRuleNode(node.__key);
  }
  static importJSON() {
    return new HorizontalRuleNode();
  }
  exportJSON(): SerializedLexicalNode {
    return { type: 'horizontalrule', version: 1 };
  }
  createDOM() {
    return document.createElement('hr');
  }
  updateDOM() {
    return false;
  }
  decorate() {
    return null;
  }
}
const $createHorizontalRuleNode = () => new HorizontalRuleNode();
const $isHorizontalRuleNode = (
  node: LexicalNode | null | undefined,
): node is HorizontalRuleNode => node instanceof HorizontalRuleNode;

import { createEditorModel } from '../core';
import {
  createMarkdownApi,
  markdownLooksLike,
  registerMarkdownPaste,
} from './index';

const onError = (e: Error) => {
  throw e;
};

const model = () =>
  createEditorModel({
    namespace: 'md',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    onError,
  });

// A horizontal-rule transformer (Lexical's default TRANSFORMERS omit it).
const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => ($isHorizontalRuleNode(node) ? '***' : null),
  regExp: /^(-{3,}|\*{3,}|_{3,})\s*$/,
  replace: (parentNode, _children, _match, isImport) => {
    const line = $createHorizontalRuleNode();
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }
    line.selectNext();
  },
  type: 'element',
};

describe('createMarkdownApi', () => {
  it('imports Markdown into the editor', async () => {
    const editor = model();
    const { importMarkdownFx } = createMarkdownApi(editor);

    await importMarkdownFx('# Title\n\nsome **bold** text');

    expect(editor.$text.getState()).toContain('Title');
    expect(editor.$text.getState()).toContain('bold');
    editor.destroy();
  });

  it('exports the editor content as Markdown', async () => {
    const editor = model();
    const { exportMarkdownFx, importMarkdownFx } = createMarkdownApi(editor);

    await importMarkdownFx('# Title\n\nsome **bold** text');
    const md = await exportMarkdownFx();

    expect(md).toContain('# Title');
    expect(md).toContain('**bold**');
    editor.destroy();
  });

  it('round-trips content through Markdown', async () => {
    const source = model();
    const target = model();
    const a = createMarkdownApi(source);
    const b = createMarkdownApi(target);

    await a.importMarkdownFx('- one\n- two');
    await b.importMarkdownFx(await a.exportMarkdownFx());

    expect(target.$text.getState()).toContain('one');
    expect(target.$text.getState()).toContain('two');
    source.destroy();
    target.destroy();
  });
});

describe('markdownLooksLike', () => {
  it.each([
    '# Heading',
    '- item',
    '1. item',
    '> quote',
    '**bold** text',
    '`code`',
    '[link](https://x)',
    '___',
    '---',
    '*****',
  ])('detects %j as markdown', (text) => {
    expect(markdownLooksLike(text)).toBe(true);
  });

  it.each(['just plain text', 'a-b-c', 'email me at a@b.com'])(
    'treats %j as plain text',
    (text) => {
      expect(markdownLooksLike(text)).toBe(false);
    },
  );
});

describe('registerMarkdownPaste', () => {
  it('returns a cleanup and does not throw', () => {
    const editor = model();
    const stop = registerMarkdownPaste(editor, { transformers: TRANSFORMERS });
    expect(typeof stop).toBe('function');
    expect(() => stop()).not.toThrow();
    editor.destroy();
  });
});

describe('horizontal rule transformer (___ / ---)', () => {
  const hrModel = () =>
    createEditorModel({
      namespace: 'hr',
      nodes: [HeadingNode, ListNode, ListItemNode, HorizontalRuleNode],
      onError,
    });
  const transformers = [HR, ...TRANSFORMERS];

  it.each(['___', '---', '***'])('converts %j to a horizontal rule', (rule) => {
    const editor = hrModel();
    editor.editor.update(
      () =>
        $convertFromMarkdownString(`before\n\n${rule}\n\nafter`, transformers),
      { discrete: true },
    );
    const hasHr = editor.editor.getEditorState().read(() =>
      $getRoot()
        .getChildren()
        .some((n) => $isHorizontalRuleNode(n)),
    );
    expect(hasHr).toBe(true);
    editor.destroy();
  });

  it('exports a horizontal rule back to markdown', () => {
    const editor = hrModel();
    let md = '';
    editor.editor.update(
      () => {
        $convertFromMarkdownString('a\n\n---\n\nb', transformers);
        md = $convertToMarkdownString(transformers);
      },
      { discrete: true },
    );
    expect(md).toContain('***');
    editor.destroy();
  });
});
