# effector-lexical — Specification

This document describes the public API and the design decisions behind it. It is
the source of truth for behaviour; the docs site is the friendly version.

## 1. Goals

- Bridge Lexical's **imperative** API (mutable editor + listeners + commands) to
  effector's **declarative** units (stores/events/effects).
- No subscription leaks: the model owns the lifecycle of every Lexical listener.
- Framework-agnostic core; React is an optional, thin adapter.
- Stay out of the way: standard `@lexical/react` plugins must keep working.

## 2. Architecture

```
core  (effector-lexical)        — owns the LexicalEditor, exposes effector units
react (effector-lexical/react)  — injects the editor into LexicalComposerContext
```

Two subpath exports: `.` (core) and `./react`. The core has zero React/DOM
coupling beyond what Lexical itself needs.

### 2.1 Ownership

`createEditorModel(config)` calls `createEditor(config)` and **owns** the
resulting instance for the model's lifetime. This is a deliberate choice over
"attach to an externally-created editor":

- It makes the model the single source of truth.
- It works headless (no `LexicalComposer`).
- React compatibility is preserved by injecting the instance into
  `LexicalComposerContext` (see §4), which `LexicalComposer` would otherwise
  create itself.

## 3. Core API

### 3.1 `createEditorModel(config?: CreateEditorModelConfig): EditorModel`

`CreateEditorModelConfig` is Lexical's `CreateEditorArgs` (namespace, nodes,
theme, onError, editable, editorState, …), forwarded verbatim.

### 3.2 `EditorModel`

| Member            | Type                                                | Backed by                     |
| ----------------- | --------------------------------------------------- | ----------------------------- |
| `editor`          | `LexicalEditor`                                     | `createEditor`                |
| `$instance`       | `Store<LexicalEditor>`                              | constant store                |
| `updated`         | `Event<UpdatePayload>`                              | `registerUpdateListener`      |
| `textChanged`     | `Event<string>`                                     | `registerTextContentListener` |
| `editableChanged` | `Event<boolean>`                                    | `registerEditableListener`    |
| `rootChanged`     | `Event<RootPayload>`                                | `registerRootListener`        |
| `$state`          | `Store<EditorState>`                                | `updated`                     |
| `$text`           | `Store<string>`                                     | `textChanged`                 |
| `$editable`       | `Store<boolean>`                                    | `editableChanged`             |
| `$json`           | `Store<SerializedEditorState>`                      | `$state.map(toJSON)`          |
| `$selection`      | `Store<SelectionSnapshot \| null>`                  | snapshot from `updated`       |
| `updateFx`        | `Effect<UpdateParams, void>`                        | `editor.update`               |
| `setStateFx`      | `Effect<EditorState \| Serialized \| string, void>` | `editor.setEditorState`       |
| `setEditableFx`   | `Effect<boolean, void>`                             | `editor.setEditable`          |
| `focusFx`         | `Effect<void, void>`                                | `editor.focus`                |
| `blurFx`          | `Effect<void, void>`                                | `editor.blur`                 |
| `read`            | `<T>(reader: () => T) => T`                         | `editorState.read`            |
| `attachToScope`   | `(scope: Scope) => void`                            | `scopeBind` rebinding         |
| `detachScope`     | `() => void`                                        | clears bound scope            |
| `command`         | `(cmd, priority?) => CommandModel`                  | `registerCommand`/`dispatch`  |
| `mutations`       | `(NodeClass, options?) => Event`                    | `registerMutationListener`    |
| `nodeTransform`   | `(NodeClass, fn) => () => void`                     | `registerNodeTransform`       |
| `history`         | `() => HistoryModel`                                | CAN_UNDO/CAN_REDO + commands  |
| `destroy`         | `() => void`                                        | all unsubscribers             |

### 3.3 Behavioural contracts

- **`updateFx` resolves after reconciliation.** It wraps `editor.update` and
  resolves in the `onUpdate` callback, so awaiting it guarantees the DOM/state is
  committed. A throwing writer rejects the effect with the thrown error. A
  user-supplied `options.onUpdate` is still invoked.
- **Listener callbacks must return `void`.** Lexical treats a listener's return
  value as a teardown function (`listener(...args) || undefined`). Because
  calling an effector event returns its payload, every internal listener is
  wrapped so it returns `undefined` — otherwise `destroy()` would try to call a
  payload as a function. This is the single most important implementation detail.
- **`command().triggered` never consumes.** The internal command handler returns
  `false`, so observation does not block other handlers. Default priority is
  `COMMAND_PRIORITY_EDITOR`.
- **`setStateFx` input detection.** A `string` is parsed via `parseEditorState`;
  an object with a `read` method is treated as a live `EditorState`; any other
  object is treated as a serialized state and parsed.
- **`destroy()` is total.** It removes the update/text/editable/root listeners
  plus every listener created by `command()` and `mutations()`.
- **Listener emissions default to the global scope.** Events fed by Lexical
  listeners are called from Lexical callbacks, i.e. outside any effector scope,
  so by default they update the global store states. Call `attachToScope(scope)`
  to route every emission (core events, `command` and `mutations`) into a forked
  scope via `scopeBind`; `detachScope()` reverts. Full explanation: docs →
  Recipes → _Scope, SSR & testing_.

## 4. React adapter

`<EditorProvider model>` provides two contexts:

1. `LexicalComposerContext` with the value
   `[model.editor, createLexicalComposerContext(null, editor._config.theme)]`,
   so official plugins (`RichTextPlugin`, `ContentEditable`, `HistoryPlugin`, …)
   resolve the editor through `useLexicalComposerContext()`.
2. An internal context exposing the `EditorModel` via `useEditorModel()` /
   `useEditorInstance()`.

The adapter does **not** depend on `effector-react`; consumers read stores with
their preferred method.

## 5. Non-goals (v0)

- No bundled UI / toolbar components.
- No `effector` scope/`fork` serialization of the editor instance (it is not
  serializable; SSR is supported only for headless state parsing). Listener-fed
  stores can be routed into a forked scope with `attachToScope` (§3.3), but the
  editor object itself is never duplicated per scope.
- Solid/Vue adapters — planned, not in v0.

## 6. Versioning & tooling

- Conventional Commits (enforced via commitlint + lefthook).
- Build: Vite library mode (ESM + CJS) with `vite-plugin-dts` for declarations.
- Tests: Vitest (jsdom), 100% line coverage target for `src`.
