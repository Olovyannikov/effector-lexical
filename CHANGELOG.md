# effector-lexical

## 0.1.0

### Minor Changes

- 73cef53: Add HTML and Markdown serialization effects via new subpath entry points
  `effector-lexical/html` (`createHtmlApi`) and `effector-lexical/markdown`
  (`createMarkdownApi`), backed by the optional `@lexical/html` and
  `@lexical/markdown` peers.
- 20b3353: Initial release: effector bindings for Lexical.

  - `createEditorModel` core: listeners as events, state mirrored into stores
    (`$state`/`$text`/`$json`/`$editable`), effects (`updateFx`/`setStateFx`/
    `setEditableFx`/`focusFx`/`blurFx`), `read`/`command`/`mutations`/`history`.
  - `attachToScope`/`detachScope` for scope-safe emissions.
  - React adapter `effector-lexical/react`: `EditorProvider`, `useEditorModel`,
    `useEditorInstance`.

- d664a28: Add `registerMarkdownPaste(model, options?)` to `effector-lexical/markdown`:
  converts pasted Markdown into nodes at the caret (via `PASTE_COMMAND` and the
  optional `@lexical/clipboard` peer, loaded lazily). Also export the
  `markdownLooksLike` detection helper.
- f699656: Add a `$selection` store (a safe `{ isCollapsed, isBackward, text }` snapshot of
  the current range selection) and a `nodeTransform(NodeClass, fn)` helper that
  registers a Lexical node transform tracked by `destroy()`.
- 738ffa0: Add Solid and Vue framework adapters. `effector-lexical/solid` exposes
  `editorRef` (a `ref` callback) and `mountEditor` (imperative bind + cleanup);
  `effector-lexical/vue` exposes the `useEditorRoot` composable returning a
  template ref. Both bind the model's editor to a contenteditable element and
  unbind it on cleanup, with reactivity provided by `effector-solid` /
  `effector-vue`.
