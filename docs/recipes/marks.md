# Show formatting marks

A Word-like "show formatting marks" toggle, driven by an effector store and
applied to the editor through a small reusable plugin.

## The store

```ts
import { createEvent, createStore } from 'effector';

export const toggleMarks = createEvent();
export const $marks = createStore(false).on(toggleMarks, (on) => !on);
```

## The plugin

The plugin reflects `$marks` onto the editor's **root element** as a class, and
re-applies it when the root element changes. CSS does the rest.

```tsx
import { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { useEditorInstance } from 'effector-lexical/react';
import { $marks } from './marks';

export function FormattingMarksPlugin() {
  const on = useUnit($marks);
  const editor = useEditorInstance();
  useEffect(() => {
    // Must return void — Lexical treats a root-listener's return value as a
    // teardown fn, and classList.toggle returns a boolean.
    const apply = (root: HTMLElement | null) => {
      root?.classList.toggle('marks-on', on);
    };
    apply(editor.getRootElement());
    return editor.registerRootListener(apply);
  }, [editor, on]);
  return null;
}
```

Drop it next to the other plugins:

```tsx
<EditorProvider model={editor}>
  <RichTextPlugin /* … */ />
  <FormattingMarksPlugin />
</EditorProvider>
```

## The CSS

Show a pilcrow at the end of each block. Empty blocks render a lone `<br>`; hide
it so the `¶` stays on the same line instead of dropping to the next one.

```css
.editor.marks-on :where(p, h1, h2, blockquote, li)::after {
  content: '¶';
  opacity: 0.5;
}
.editor.marks-on :where(p, h1, h2, blockquote, li) > br:only-child {
  display: none;
}
```

## Per-space dots (a custom node)

Showing a `·` for **every space** needs more than CSS: an unformatted text run is
a single DOM text node, so there's no per-space element to target. The naive fix
— a transform that tags whitespace with an inline `style`/`format` — **breaks
typing**, because Lexical **inherits a text node's `format`/`style` onto newly
typed text**, so characters typed after a marked space inherit the marker and
render invisible.

The robust route is a **dedicated node type** — the marker lives in the node's
**type** and a real `class` (neither is inherited on typing), so new text is a
plain `TextNode` and stays visible.

```ts
import { TextNode, type EditorConfig } from 'lexical';

export class WhitespaceNode extends TextNode {
  static getType() {
    return 'whitespace';
  }
  static clone(n: WhitespaceNode) {
    return new WhitespaceNode(n.__text, n.__key);
  }
  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.classList.add('ws-mark'); // class, not format/style → not inherited
    return dom;
  }
  // keep it a single space; typed text lands in sibling plain nodes
  canInsertTextBefore() {
    return false;
  }
  canInsertTextAfter() {
    return false;
  }
}
```

A transform converts whitespace into `WhitespaceNode` while the toggle is on and
reverts it when off (a sibling transform on `WhitespaceNode` turns it back into a
plain `TextNode`, which then merges). CSS keeps the real space (for copy/paste)
but draws the dot:

```css
.editor.marks-on .ws-mark {
  position: relative;
  color: transparent;
}
.editor.marks-on .ws-mark::before {
  content: '·';
  position: absolute;
  inset: 0;
  text-align: center;
}
```

The full implementation (the node, transforms and a `refresh` helper to
re-process content on toggle) is in the playground source:
[`showInvisibles.ts`](https://github.com/Olovyannikov/effector-lexical/blob/main/docs/.vitepress/theme/demo/showInvisibles.ts).
Try it on the [Playground](/playground) with the ¶ toggle.

## Line breaks (`↵`) and empty lines

Two CSS-only tricks keep the markers caret-safe (no DOM/node changes):

```css
/* ↵ for a soft line break — mark the text span BEFORE the <br>, never the <br>
   itself (br::after is unreliable; wrapping the <br> breaks the caret). */
.editor.marks-on span[data-lexical-text]:has(+ br)::after {
  content: '↵';
}

/* Empty blocks render a lone <br> that browsers refuse to hide, so overlay ¶ on
   that line with an absolute pseudo instead of adding a line below it. */
.editor.marks-on :where(p, h1, h2, blockquote, li):has(> br:only-child) {
  position: relative;
}
.editor.marks-on :where(p, h1, h2, blockquote, li):has(> br:only-child)::after {
  content: '¶';
  position: absolute;
  inset: 0 auto auto 0;
}
```

**Enter** ends a paragraph (`¶`); **Shift+Enter** inserts a line break (`↵`).
