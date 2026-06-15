# Collaboration (Yjs)

Real-time collaboration is a standard `@lexical/react` plugin —
`CollaborationPlugin` — and it works inside `<EditorProvider>` unchanged
(the provider injects the editor into `LexicalComposerContext`, which the plugin
reads). effector's job is the **connection state** around the provider.

```bash
pnpm add yjs y-websocket
```

## Connection state as effector stores

Wire the Yjs provider's events into stores, so the rest of your app (status
badge, presence, "saving…" indicator) stays declarative.

```ts
import { createEvent, createStore } from 'effector';
import { createEditorModel } from 'effector-lexical';
import type { Provider } from '@lexical/yjs';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export const editor = createEditorModel({
  namespace: 'collab',
  onError: (e) => {
    throw e;
  },
});

type Status = 'connecting' | 'connected' | 'disconnected';
const statusChanged = createEvent<Status>();
const peersChanged = createEvent<number>();

export const $status = createStore<Status>('disconnected').on(
  statusChanged,
  (_, s) => s,
);
export const $peers = createStore(1).on(peersChanged, (_, n) => n);

export function providerFactory(
  id: string,
  yjsDocMap: Map<string, Y.Doc>,
): Provider {
  let doc = yjsDocMap.get(id);
  if (!doc) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }
  const provider = new WebsocketProvider('wss://your-server', id, doc, {
    connect: false,
  });
  provider.on('status', (e: { status: Status }) => statusChanged(e.status));
  provider.awareness.on('change', () =>
    peersChanged(provider.awareness.getStates().size),
  );
  return provider as unknown as Provider;
}
```

## Render

Use `CollaborationPlugin` **instead of** `HistoryPlugin` — it owns the document
(undo/redo included) and bootstraps the initial state. Start the model's editor
empty (the default).

```tsx
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { useUnit } from 'effector-react';

<EditorProvider model={editor}>
  <RichTextPlugin /* … */ />
  <CollaborationPlugin
    id="room-1"
    providerFactory={providerFactory}
    shouldBootstrap
  />
</EditorProvider>;

// anywhere:
const status = useUnit($status); // 'connecting' | 'connected' | 'disconnected'
```

The model's own stores keep working: `$text`, `$json`, `updated` reflect
remote edits too, because they're driven by the editor's listeners regardless of
who made the change.

::: tip Runnable example
[`examples/react-collab`](https://github.com/Olovyannikov/effector-lexical/tree/main/examples/react-collab)
is a full app (open it in two tabs to see live sync) using the public
`wss://demos.yjs.dev` server. For production, run your own
[`y-websocket`](https://github.com/yjs/y-websocket) server.
:::
