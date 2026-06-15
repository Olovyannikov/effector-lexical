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
