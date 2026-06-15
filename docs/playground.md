# Playground

A richer editor — headings, quotes, bullet/numbered lists, links and inline
formatting, with full history. Everything you see in the toolbar is driven by
effector:

- buttons are **events** bound with `useUnit`;
- the **active** format and current **block type** come from a store derived
  from the `updated` event (see [Selection & formatting](./recipes/selection));
- undo/redo availability is `history()`'s `$canUndo` / `$canRedo`;
- the footer counters read the `$text` store;
- the **MD** button switches to a Markdown source view — `exportMarkdownFx`
  dumps the content on the way in, `importMarkdownFx` applies your edits on the
  way back (see [HTML & Markdown](./recipes/serialization));
- **live Markdown shortcuts** — type `# `, `- `, `> `, ` ``` ` or `**bold**`
  and it formats as you type (Lexical's `MarkdownShortcutPlugin`);
- **paste Markdown** — paste text that looks like Markdown and it converts into
  nodes at the caret (`PASTE_COMMAND` + `@lexical/clipboard`).

<LexicalPlayground />

The model registers the rich-text nodes and binds the commands:

```ts
const editor = createEditorModel({
  namespace: 'playground',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
  onError: (e) => {
    throw e;
  },
});

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
const bold = format.dispatch.prepend(() => 'bold' as const);

const setBlockFx = attach({
  effect: editor.updateFx,
  mapParams: (create: () => ElementNode) => () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) $setBlocksType(selection, create);
  },
});
const toH1 = setBlockFx.prepend(() => () => $createHeadingNode('h1'));

const { $canUndo, $canRedo, undo, redo } = editor.history();
```

Render with the standard `@lexical/react` plugins inside `<EditorProvider>`
(`RichTextPlugin`, `HistoryPlugin`, `ListPlugin`, `LinkPlugin`). See the
[Core API](./api/core) and [React API](./api/react) for the full surface.
