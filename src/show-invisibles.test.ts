import { describe, it, expect } from 'vitest';
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $createLineBreakNode,
  type LexicalEditor,
} from 'lexical';

import {
  SHOW_INVISIBLES_NODES,
  registerShowInvisibles,
  refreshInvisibles,
} from '../docs/.vitepress/theme/demo/showInvisibles';

const onError = (e: Error) => {
  throw e;
};

const makeEditor = (on: () => boolean) => {
  const editor = createEditor({
    namespace: 'si',
    nodes: SHOW_INVISIBLES_NODES,
    onError,
  });
  editor.setRootElement(document.createElement('div'));
  registerShowInvisibles(editor, on);
  return editor;
};

const paraTypes = (editor: LexicalEditor) =>
  editor.getEditorState().read(() =>
    $getRoot()
      .getFirstChild()!
      // @ts-expect-error element node
      .getChildren()
      .map((n: { getType(): string }) => n.getType()),
  );

describe('showInvisibles: WhitespaceNode logic', () => {
  it('splits each space into a WhitespaceNode while on', () => {
    const editor = makeEditor(() => true);
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode().append($createTextNode('a b c')));
      },
      { discrete: true },
    );
    expect(paraTypes(editor)).toEqual([
      'text',
      'whitespace',
      'text',
      'whitespace',
      'text',
    ]);
  });

  it('text typed after a space stays a plain TextNode (visible)', () => {
    const editor = makeEditor(() => true);
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode().append($createTextNode('a ')));
      },
      { discrete: true },
    );
    editor.update(
      () => {
        // @ts-expect-error element node
        $getRoot().getFirstChild()!.append($createTextNode('b'));
      },
      { discrete: true },
    );
    const types = paraTypes(editor);
    // 'a' text, ' ' whitespace, 'b' text — the typed 'b' is never 'whitespace'
    expect(types).toContain('text');
    expect(types.filter((t) => t === 'whitespace')).toHaveLength(1);
    const text = editor
      .getEditorState()
      .read(() => $getRoot().getTextContent());
    expect(text).toBe('a b');
  });

  it('reverts WhitespaceNodes to plain text when toggled off', () => {
    let on = true;
    const editor = makeEditor(() => on);
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode().append($createTextNode('x y')));
      },
      { discrete: true },
    );
    expect(paraTypes(editor)).toContain('whitespace');

    on = false;
    refreshInvisibles(editor);
    // refreshInvisibles uses a non-discrete update (transforms run on a
    // microtask); flush synchronously so we can assert.
    editor.update(() => {}, { discrete: true });
    expect(paraTypes(editor)).not.toContain('whitespace');
    expect(
      editor.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe('x y');
  });
});

// These guard the DOM shapes the marks CSS selectors depend on. If a Lexical
// upgrade changes them, the CSS (> br:only-child, > br:last-child, span + br)
// needs revisiting — and this fails loudly.
describe('Lexical line-break DOM contract (for the ¶/↵ CSS)', () => {
  const render = (build: () => void) => {
    const el = document.createElement('div');
    const editor = createEditor({ namespace: 'dom', onError });
    editor.setRootElement(el);
    editor.update(build, { discrete: true });
    return el;
  };

  it('empty paragraph is <p><br></p> (br is the only child)', () => {
    const el = render(() => {
      $getRoot().clear().append($createParagraphNode());
    });
    const p = el.querySelector('p')!;
    expect(p.children).toHaveLength(1);
    expect(p.firstElementChild!.tagName).toBe('BR');
  });

  it('a trailing line break ends the block with a <br>', () => {
    const el = render(() => {
      const p = $createParagraphNode();
      p.append($createTextNode('text'));
      p.append($createLineBreakNode());
      $getRoot().clear().append(p);
    });
    const p = el.querySelector('p')!;
    expect(p.lastElementChild!.tagName).toBe('BR');
  });

  it('a mid-paragraph soft break has a text span immediately before the <br>', () => {
    const el = render(() => {
      const p = $createParagraphNode();
      p.append($createTextNode('a'));
      p.append($createLineBreakNode());
      p.append($createTextNode('b'));
      $getRoot().clear().append(p);
    });
    const br = el.querySelector('br')!;
    expect(br.previousElementSibling?.getAttribute('data-lexical-text')).toBe(
      'true',
    );
  });
});
