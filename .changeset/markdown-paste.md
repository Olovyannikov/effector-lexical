---
'effector-lexical': minor
---

Add `registerMarkdownPaste(model, options?)` to `effector-lexical/markdown`:
converts pasted Markdown into nodes at the caret (via `PASTE_COMMAND` and the
optional `@lexical/clipboard` peer, loaded lazily). Also export the
`markdownLooksLike` detection helper.
