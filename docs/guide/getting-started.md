# What & why

[Lexical](https://lexical.dev) is an **imperative** editor: you hold a mutable
`LexicalEditor` instance, attach listeners (`registerUpdateListener`,
`registerTextContentListener`, `registerCommand`, …) and mutate state through
`editor.update(() => …)`. Every `register*` call returns an unsubscribe function.

[Effector](https://effector.dev) is a **declarative** world of stores, events
and effects.

`effector-lexical` is the bridge between the two:

- **Incoming** — Lexical listeners become effector **events** and the editor
  state is mirrored into **stores** (`$text`, `$state`, `$json`, `$editable`).
- **Outgoing** — effector **effects** wrap `editor.update`, `setEditorState` and
  command dispatch.

The lifecycle of all Lexical listeners is owned by the model, so there are no
leaks: call `destroy()` and every subscription is removed.

## Design at a glance

```
                ┌─────────────────────────── EditorModel ───────────────────────────┐
  Lexical  ──►  registerUpdateListener ─► updated ─► $state ─► $json                 │
  listeners     registerTextContent…   ─► textChanged ─► $text                       │
                registerEditableList… ─► editableChanged ─► $editable                │
                                                                                     │
  effector ──►  updateFx  ─► editor.update                                           │
  effects       setStateFx ─► editor.setEditorState                                  │
                command()  ─► editor.registerCommand / dispatchCommand               │
                └─────────────────────────────────────────────────────────────────┘
```

The **core** package is framework-agnostic and owns the editor (it calls
`createEditor` for you). The **React** layer is a thin adapter that injects that
editor into `LexicalComposerContext` so the standard `@lexical/react` plugins
keep working.

Continue with [Installation](./installation) and the
[Quick start](./quick-start).
