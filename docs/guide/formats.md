# Output formats

Lexical can produce four representations of your content. Each has a different
purpose and a different round-trip fidelity — pick the right one for the job.

## EditorState JSON

The canonical format. `SerializedEditorState` is a plain object describing the
whole node tree. It is **lossless and persistable** — store it, send it over the
wire, and restore it exactly.

Get it from the `$json` store (the model maps `$state.toJSON()`):

```ts
const json = editor.$json.getState();
```

…or read it on demand:

```ts
const json = editor.read(() => editor.editor.getEditorState().toJSON());
```

A paragraph with the word **world** in bold serializes to:

```json
{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Hello ",
            "type": "text",
            "version": 1
          },
          {
            "detail": 0,
            "format": 1,
            "mode": "normal",
            "style": "",
            "text": "world",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}
```

`format: 1` means **bold** — `format` on a text node is a bitmask (bold = 1,
italic = 2, …), so combinations add up.

Restore it with `setStateFx` (accepts an `EditorState`, a serialized object, or a
JSON string):

```ts
await editor.setStateFx(json);
```

## HTML

Via the [`effector-lexical/html`](/recipes/serialization) entry point:

```ts
import { createHtmlApi } from 'effector-lexical/html';

const { exportHtmlFx, importHtmlFx } = createHtmlApi(editor);

const html = await exportHtmlFx();
await importHtmlFx('<p>hello <strong>world</strong></p>');
```

The same paragraph exports to roughly:

```html
<p>
  <span style="white-space: pre-wrap;">Hello </span
  ><strong style="white-space: pre-wrap;">world</strong>
</p>
```

HTML is for **interop and clipboard** (paste into email, a CMS, another editor).
It is **not** perfectly round-trippable — exporting then importing can lose
editor-specific detail.

## Markdown

Via the [`effector-lexical/markdown`](/recipes/serialization) entry point:

```ts
import { createMarkdownApi } from 'effector-lexical/markdown';

const { exportMarkdownFx, importMarkdownFx } = createMarkdownApi(editor);

const md = await exportMarkdownFx(); // "Hello **world**"
await importMarkdownFx('Hello **world**');
```

Markdown is **human-editable source**, but **lossy** — only what the transformers
cover survives the trip. Anything outside the transformer set is dropped.

## Plain text

Just read the `$text` store:

```ts
const text = editor.$text.getState(); // "Hello world"
```

Useful for search indexing, character/word counts, and previews.

## Comparison

| Format           | How to get                                     | Round-trip fidelity       | Use case                              |
| ---------------- | ---------------------------------------------- | ------------------------- | ------------------------------------- |
| EditorState JSON | `$json` / `editor.read(...)`                   | Lossless                  | Storage, persistence, source of truth |
| HTML             | `createHtmlApi(editor).exportHtmlFx()`         | Lossy (interop-grade)     | Interop, clipboard, email             |
| Markdown         | `createMarkdownApi(editor).exportMarkdownFx()` | Lossy (transformer-bound) | Human-editable source                 |
| Plain text       | `$text` store                                  | One-way (no structure)    | Search, counts, previews              |

## See also

- [HTML & Markdown recipe](/recipes/serialization) — import/export wiring, paste,
  live shortcuts.
- [Core API](/api/core) — `$json`, `$text`, `setStateFx`, `read`.
