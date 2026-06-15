# HTML & Markdown

Serialize the editor to/from HTML and Markdown as effector effects. These live in
separate entry points so the underlying Lexical packages stay optional:

::: code-group

```bash [HTML]
pnpm add @lexical/html
```

```bash [Markdown]
pnpm add @lexical/markdown
```

:::

## HTML

```ts
import { createHtmlApi } from 'effector-lexical/html';

const { exportHtmlFx, importHtmlFx } = createHtmlApi(editor);

// export → string
const html = await exportHtmlFx();

// import (replaces content)
await importHtmlFx('<p>hello <strong>world</strong></p>');
```

| Unit           | Type                   | Description                         |
| -------------- | ---------------------- | ----------------------------------- |
| `exportHtmlFx` | `Effect<void, string>` | Current content → HTML string.      |
| `importHtmlFx` | `Effect<string, void>` | Parse HTML and replace the content. |

## Markdown

`createMarkdownApi` takes optional `transformers` (defaults to Lexical's
`TRANSFORMERS`). Pass your own to match the nodes your editor registers.

```ts
import { createMarkdownApi } from 'effector-lexical/markdown';

const { exportMarkdownFx, importMarkdownFx } = createMarkdownApi(editor);

const md = await exportMarkdownFx();
await importMarkdownFx('# Title\n\nsome **bold** text');
```

| Unit               | Type                   | Description                             |
| ------------------ | ---------------------- | --------------------------------------- |
| `exportMarkdownFx` | `Effect<void, string>` | Current content → Markdown string.      |
| `importMarkdownFx` | `Effect<string, void>` | Parse Markdown and replace the content. |

## Wiring with the rest

Both are plain effects — combine them with `sample` like any other. Load from a
server, autosave as Markdown, export on a button:

```ts
import { sample } from 'effector';

// server returns HTML → import it
sample({ clock: loadHtmlFx.doneData, target: importHtmlFx });

// debounced autosave as Markdown
sample({ clock: debounce(editor.updated, 800), target: exportMarkdownFx });
sample({ clock: exportMarkdownFx.doneData, target: saveMarkdownFx });
```

::: tip Registered nodes
Import only produces nodes your editor knows about. Register the matching nodes
(`HeadingNode`, `ListNode`, `LinkNode`, …) in `createEditorModel({ nodes })` and,
for Markdown, pass transformers that cover them.
:::

## Live Markdown shortcuts (type `# ` → heading)

To format Markdown **as you type** (`# ` → H1, `- ` → list, `**bold**`), use
Lexical's own `MarkdownShortcutPlugin` inside `<EditorProvider>` — it's a plain
Lexical plugin, no effector wiring needed:

```tsx
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';

<EditorProvider model={editor}>
  <RichTextPlugin /* … */ />
  <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
</EditorProvider>;
```

The same `transformers` drive shortcuts, `importMarkdownFx` and
`exportMarkdownFx` — keep one list so all three stay consistent. Register the
nodes the transformers need (`HeadingNode`, `ListNode`, `QuoteNode`, `CodeNode`,
`LinkNode`, …).

## Paste Markdown → convert at the caret

The shortcut plugin only reacts to typing, and `$convertFromMarkdownString`
replaces the **whole** document. To convert _pasted_ Markdown **in place**, use
`registerMarkdownPaste` — it intercepts `PASTE_COMMAND`, and when the clipboard
text passes the `match` heuristic it builds nodes in a throwaway editor and
inserts them at the selection:

```ts
import { registerMarkdownPaste } from 'effector-lexical/markdown';

const stop = registerMarkdownPaste(editor, {
  transformers: MD_TRANSFORMERS, // same list as shortcuts / import / export
  // match: (text) => text.includes('#'), // optional; defaults to a Markdown heuristic
});
// later: stop()
```

It needs the optional `@lexical/clipboard` peer (loaded lazily, so importing
`effector-lexical/markdown` for export/import only doesn't require it). The
helper derives the throwaway editor's nodes from the transformers'
`dependencies`, so heading/list/quote/code/link all convert. A single block
merges into the current block and multiple blocks insert as siblings, just like
native paste; plain (non-Markdown) text stays plain. Tweak detection with
`match`, or reuse the exported `markdownLooksLike`. Live in the
[Playground](/playground).

## Nodes the transformers cover (and `---` rules)

The default `TRANSFORMERS` handle headings, lists, quotes, code, links and
inline `**bold**`/`*italic*`/`` `code` ``. They **don't** include a
horizontal-rule transformer — add one for `---` / `***` / `___`:

```ts
import { type ElementTransformer } from '@lexical/markdown';
import {
  HorizontalRuleNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from './HorizontalRuleNode'; // your node (or @lexical's)

const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => ($isHorizontalRuleNode(node) ? '***' : null),
  regExp: /^(-{3,}|\*{3,}|_{3,})\s*$/,
  replace: (parentNode, _c, _m, isImport) => {
    const line = $createHorizontalRuleNode();
    isImport || parentNode.getNextSibling()
      ? parentNode.replace(line)
      : parentNode.insertBefore(line);
    line.selectNext();
  },
  type: 'element',
};

const MD_TRANSFORMERS = [HR, ...TRANSFORMERS];
```

Use **one** `MD_TRANSFORMERS` list for the shortcut plugin, `createMarkdownApi`
and `registerMarkdownPaste` so typing, import/export and paste stay consistent —
and register the nodes they depend on (here `HorizontalRuleNode`).
