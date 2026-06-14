---
'effector-lexical': minor
---

Initial release: effector bindings for Lexical.

- `createEditorModel` core: listeners as events, state mirrored into stores
  (`$state`/`$text`/`$json`/`$editable`), effects (`updateFx`/`setStateFx`/
  `setEditableFx`/`focusFx`/`blurFx`), `read`/`command`/`mutations`/`history`.
- `attachToScope`/`detachScope` for scope-safe emissions.
- React adapter `effector-lexical/react`: `EditorProvider`, `useEditorModel`,
  `useEditorInstance`.
