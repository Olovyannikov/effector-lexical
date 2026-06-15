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
replaces the **whole** document — so to convert _pasted_ Markdown in place,
intercept `PASTE_COMMAND`, build the nodes in a throwaway editor, and insert them
at the selection with `@lexical/clipboard`:

```ts
import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
  $insertGeneratedNodes,
} from '@lexical/clipboard';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import {
  createEditor,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';

const toNodesJSON = (md: string) => {
  const temp = createEditor({
    nodes: NODES,
    onError: (e) => {
      throw e;
    },
  });
  let nodes = [];
  temp.update(
    () => {
      $convertFromMarkdownString(md, TRANSFORMERS);
      const root = $getRoot();
      nodes = $generateJSONFromSelectedNodes(
        temp,
        root.select(0, root.getChildrenSize()),
      ).nodes;
    },
    { discrete: true },
  );
  return nodes;
};

editor.editor.registerCommand(
  PASTE_COMMAND,
  (event) => {
    if (!(event instanceof ClipboardEvent)) return false;
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!looksLikeMarkdown(text)) return false; // let plain paste run
    event.preventDefault();
    const serialized = toNodesJSON(text);
    editor.editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $insertGeneratedNodes(
        editor.editor,
        $generateNodesFromSerializedNodes(serialized),
        selection,
      );
    });
    return true;
  },
  COMMAND_PRIORITY_HIGH,
);
```

The throwaway editor must register the **same nodes** as the real one.
`$generateJSONFromSelectedNodes` serializes nodes **with their children** (a bare
`node.exportJSON()` does not), and `$insertGeneratedNodes` is what Lexical's own
rich paste uses — so a single block merges into the current block and multiple
blocks insert as siblings, just like native paste. Gate it behind a
"looks like Markdown" check so ordinary text stays plain. Live in the
[Playground](/playground).
