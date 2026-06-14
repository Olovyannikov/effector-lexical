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
    const apply = (root: HTMLElement | null) =>
      root?.classList.toggle('marks-on', on);
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

## On per-space dots and line-break arrows

Showing a `·` for **every space** (like Word) or a `↵` for soft line breaks is
**not robustly doable with CSS** in a Lexical editor: an unformatted text run is
a single DOM text node, so there is no per-space element to target, and a `<br>`
can't carry generated content. Lexical also owns the DOM, so injecting marker
spans from the outside gets overwritten on the next reconciliation.

The only content-preserving way is a **node transform** that splits whitespace
into `token`-mode text nodes (each rendered as its own `<span>`) so CSS can mark
them:

```ts
import { TextNode, $isTextNode } from 'lexical';

// Split leading/trailing/!inner spaces into token nodes tagged for CSS.
editor.editor.registerNodeTransform(TextNode, (node) => {
  if (!$marks.getState() || node.getMode() === 'token') return;
  const text = node.getTextContent();
  const i = text.indexOf(' ');
  if (i === -1) return;
  // isolate the space run and mark it
  const space = i === 0 ? node : node.splitText(i)[1];
  space.setMode('token').setStyle('--ws:1');
});
```

```css
.editor.marks-on [style*='--ws'] {
  position: relative;
  color: transparent;
}
.editor.marks-on [style*='--ws']::before {
  content: '·';
  position: absolute;
  inset: 0;
  color: var(--mark-color);
  text-align: center;
}
```

::: warning Trade-off
Token-splitting every space changes the node structure and affects caret
movement, selection and copy/paste. It's fine for a read-mostly view, but for a
primary editing surface prefer the block-level `¶` marks above. Treat the
transform as experimental.
:::
