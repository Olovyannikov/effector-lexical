---
name: effector-lexical
description: Build Lexical editor features with effector using the effector-lexical bindings. Use when wiring a Lexical rich-text editor to effector stores/events/effects, creating an editor model, binding Lexical commands to effector units, mirroring editor state into stores, or integrating @lexical/react plugins with an effector-driven editor.
---

# effector-lexical

Bridges Lexical's imperative editor to effector. Two entry points:
`effector-lexical` (core) and `effector-lexical/react`.

## When to use

- Creating/owning a Lexical editor whose state lives in effector stores.
- Turning Lexical listeners (update/text/editable/root/mutation) into events.
- Dispatching/observing Lexical commands as effector units.
- Wiring `@lexical/react` plugins to an effector-driven editor.

## Core: createEditorModel

```ts
import { createEditorModel } from 'effector-lexical';

const editor = createEditorModel({
  namespace: 'app',
  nodes: [
    /* HeadingNode, ListNode, … */
  ],
  theme: {
    /* class map */
  },
  onError: (e) => {
    throw e;
  },
});
```

The model OWNS the editor (`createEditor` is called for you) and owns every
listener. The returned `EditorModel` exposes:

- Instance: `editor`, `$instance`.
- Events: `updated` (`{editorState, prevEditorState, tags}`), `textChanged`
  (`string`), `editableChanged` (`boolean`), `rootChanged`
  (`{rootElement, prevRootElement}`).
- Stores: `$state`, `$text`, `$editable`, `$json` (= `$state.map(toJSON)`).
- Effects: `updateFx` (wraps `editor.update`, resolves after reconciliation),
  `setStateFx` (EditorState | serialized | JSON string), `focusFx`, `blurFx`.
- Helpers: `read(reader)` (sync), `command(cmd, priority?)`,
  `mutations(NodeClass, options?)`, `destroy()`.

### Commands

```ts
import { FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical';

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
format.dispatch('bold'); // dispatch on the editor
format.triggered.watch(console.log); // observe (never consumes; returns false)
// Bind a zero-arg event:
const bold = format.dispatch.prepend(() => 'bold' as const);
```

### Edits

```ts
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

await editor.updateFx(() => {
  const root = $getRoot();
  root.clear();
  root.append($createParagraphNode().append($createTextNode('hi')));
});
// awaiting guarantees the state/DOM is committed.
```

## React: effector-lexical/react

Use `<EditorProvider>` INSTEAD of `<LexicalComposer>` — the editor already
exists; the provider injects it into `LexicalComposerContext` so standard
plugins work.

```tsx
import { EditorProvider, useEditorModel } from 'effector-lexical/react';
import { useUnit } from 'effector-react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

<EditorProvider model={editor}>
  <RichTextPlugin
    contentEditable={<ContentEditable />}
    placeholder={<div>Type…</div>}
    ErrorBoundary={LexicalErrorBoundary}
  />
  <HistoryPlugin />
</EditorProvider>;
```

Read stores with `useUnit` (this package does not bundle `effector-react`).
`useEditorModel()` / `useEditorInstance()` access the model in the tree.

## Common patterns

```ts
// Autosave (debounced)
sample({
  clock: debounce(editor.updated, 800),
  source: editor.$json,
  target: saveFx,
});
// Load (effect returns JSON string)
sample({ clock: loadFx.doneData, target: editor.setStateFx });
// Selection-aware toolbar
sample({
  clock: editor.updated,
  fn: () =>
    editor.read(() => {
      const s = $getSelection();
      return $isRangeSelection(s) ? s.hasFormat('bold') : false;
    }),
  target: $isBold,
});
```

## Gotcha (when writing RAW Lexical listeners)

Lexical treats a listener's return value as a teardown fn. An effector event
call returns its payload, so wrap raw listener bodies in a block:

```ts
editor.registerUpdateListener((p) => {
  myEvent(p);
}); // ✅ returns void
editor.registerUpdateListener((p) => myEvent(p)); // ❌ payload stored as "unregister"
```

(The library's own listeners already do this; this only matters if you add your
own.)

## Cleanup

Call `editor.destroy()` to remove every Lexical subscription when the model is
disposable (e.g. a per-route editor).
