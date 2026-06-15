# Collaboration (Yjs)

Real-time collaboration is a standard `@lexical/react` plugin —
`CollaborationPlugin` — and it works inside `<EditorProvider>` unchanged
(the provider injects the editor into `LexicalComposerContext`, which the plugin
reads). effector's job is the **connection state** around the provider.

Two independent editors below (each its own `createEditorModel`) share one
in-memory `Y.Doc` — type in either and watch them sync, no server:

<LexicalCollab />

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

## Cursors & presence (awareness)

Yjs has two channels: the **document** (persistent content) and **awareness**
(ephemeral presence — who's online, where their cursor is, name, color). Pass
`username` / `cursorColor` to render remote carets, and feed awareness changes
into an effector store for an "online" indicator:

```ts
import { createEvent, createStore } from 'effector';

const presenceChanged = createEvent<{ name: string; color: string }[]>();
export const $presence = createStore<{ name: string; color: string }[]>([]).on(
  presenceChanged,
  (_, peers) => peers,
);

// `provider.awareness` after the factory created it:
provider.awareness.on('change', () =>
  presenceChanged(
    [...provider.awareness.getStates().values()].map((s) => ({
      name: s.name,
      color: s.color,
    })),
  ),
);
```

```tsx
<CollaborationPlugin
  id="room-1"
  providerFactory={providerFactory}
  shouldBootstrap
  username="Alice"
  cursorColor="#e11d48"
/>
```

The in-page demo above does exactly this — two docs relayed in-memory (one per
editor, with origin guards to avoid an echo loop), awareness relayed between
them, and `$presence` driving the chips.

::: tip Runnable example
[`examples/react-collab`](https://github.com/Olovyannikov/effector-lexical/tree/main/examples/react-collab)
is a full app (open it in two tabs to see live sync) using the public
`wss://demos.yjs.dev` server. For production, run your own
[`y-websocket`](https://github.com/yjs/y-websocket) server.
:::
