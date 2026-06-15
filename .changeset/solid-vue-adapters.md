---
'effector-lexical': minor
---

Add Solid and Vue framework adapters. `effector-lexical/solid` exposes
`editorRef` (a `ref` callback) and `mountEditor` (imperative bind + cleanup);
`effector-lexical/vue` exposes the `useEditorRoot` composable returning a
template ref. Both bind the model's editor to a contenteditable element and
unbind it on cleanup, with reactivity provided by `effector-solid` /
`effector-vue`.
