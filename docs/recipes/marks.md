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

## Why per-space dots and `↵` aren't included

Showing a `·` for **every space** (like Word) or a `↵` for soft line breaks
looks easy but isn't robust on an **editable** Lexical surface:

- An unformatted text run is a **single DOM text node** — there is no per-space
  element to target with CSS, and Lexical owns the DOM, so marker spans injected
  from the outside are wiped on the next reconciliation.
- A `<br>` (LineBreakNode) **can't carry generated content** reliably across
  browsers, so `br::after { content: '↵' }` is unreliable.

The tempting fix — a node transform that splits each space into a `token` node
tagged with an inline `style`/`format` so CSS can mark it — **breaks typing**:
Lexical **inherits a text node's `format` and `style` onto newly typed text**, so
the next characters you type after a marked space inherit the marker and render
invisible. (We tried it; don't.)

The only correct route is a **dedicated node type** — a `TextNode` subclass whose
`createDOM` adds a real `class` (not `format`/`style`, which would be inherited) —
registered via a node replacement, plus a transform that converts whitespace into
it and back. That's a fair amount of machinery and still has selection/clipboard
edge cases, so it's out of scope here.

For a primary editing surface, prefer the block-level `¶` marks above — they're
robust and match Word's model: **Enter** ends a paragraph (`¶`), **Shift+Enter**
inserts a line break.
