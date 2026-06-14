# Scope, SSR & testing

## Scope note (read this before using `fork`)

A `LexicalEditor` is a single, mutable, **non-serializable** object that lives
outside effector. The model bridges its listeners to effector by calling events
directly from Lexical callbacks:

```ts
editor.registerUpdateListener((payload) => {
  updated(payload); // ← fired from Lexical, outside any effector scope
});
```

Because these emissions happen **outside an effector scope**, they land on the
**global** store states, not on a forked scope's copies. If you render under
`<Provider value={scope}>` and read with `useUnit`, listener-driven stores
(`$state`, `$text`, `$editable`, `$json`) will **not** reflect edits made in the
editor.

This is a deliberate v0 trade-off: the editor instance can't be serialized or
duplicated per scope, so per-request `fork` isolation doesn't apply to it. See
`SPEC.md` → _Non-goals_.

### Recommendation

- **Client apps:** use the model at the **global scope** (no `Provider value`
  around the editor subtree, or accept that the editor's own stores are global).
  Everything in this guide works as written.
- **SSR:** use the editor **headless** to parse/produce state, not as a scoped
  reactive store (next section).
- **If you need scoped reactivity**, open an issue — a scoped variant
  (`attachToScope(scope)` that re-binds emitters via `scopeBind`) is on the
  roadmap.

## Server-side rendering (headless)

The core works without a DOM, which is ideal for turning stored JSON into HTML on
the server. Lexical ships a headless package for `createEditor` without browser
APIs; the model wraps it the same way.

```ts
import { createEditorModel } from 'effector-lexical';

const editor = createEditorModel({ namespace: 'ssr', onError: console.error });

// Load serialized state and read derived data — no scope, no DOM.
await editor.setStateFx(jsonFromDatabase);
const text = editor.$text.getState();

editor.destroy();
```

## Testing the model (headless)

No React and no scope are required — drive the model and assert on store states.

```ts
import { describe, it, expect } from 'vitest';
import { createEditorModel } from 'effector-lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

describe('my editor model', () => {
  it('mirrors text into $text', async () => {
    const editor = createEditorModel({
      namespace: 'test',
      onError: (e) => {
        throw e;
      },
    });

    await editor.updateFx(() => {
      const root = $getRoot();
      root.clear();
      root.append($createParagraphNode().append($createTextNode('hello')));
    });

    expect(editor.$text.getState()).toBe('hello');
    editor.destroy();
  });
});
```

Create a fresh model per test for isolation, and call `destroy()` in teardown to
remove every Lexical listener.

## Cleanup

When a model is disposable (e.g. a per-route editor), release listeners:

```ts
// React
useEffect(() => () => editor.destroy(), []);
```
