// In-page collaboration: two independent editors (each its own effector model
// AND its own Y.Doc) relayed to each other in-memory — like two clients over a
// fake network. Origin guards prevent the echo loop you'd get from sharing one
// doc. Awareness is relayed too, so remote cursors + presence work.
import { createEvent, createStore } from 'effector';
import { useUnit } from 'effector-react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import type { Provider } from '@lexical/yjs';
import * as Y from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';

import { createEditorModel } from '../../../../src';
import { EditorProvider } from '../../../../src/react';

interface Peer {
  name: string;
  color: string;
}
const USERS: Record<'a' | 'b', Peer> = {
  a: { name: 'Alice', color: '#e11d48' },
  b: { name: 'Bob', color: '#2563eb' },
};

// ── Two docs relayed in-memory (no server) ──────────────────────────────
const docA = new Y.Doc();
const docB = new Y.Doc();
const DOC_RELAY = 'doc-relay';
docA.on('update', (update: Uint8Array, origin: unknown) => {
  if (origin !== DOC_RELAY) Y.applyUpdate(docB, update, DOC_RELAY);
});
docB.on('update', (update: Uint8Array, origin: unknown) => {
  if (origin !== DOC_RELAY) Y.applyUpdate(docA, update, DOC_RELAY);
});

const awA = new Awareness(docA);
const awB = new Awareness(docB);
const AW_RELAY = 'aw-relay';
function relayAwareness(from: Awareness, to: Awareness) {
  from.on(
    'update',
    (
      changes: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      if (origin === AW_RELAY) return;
      const clients = [
        ...changes.added,
        ...changes.updated,
        ...changes.removed,
      ];
      applyAwarenessUpdate(to, encodeAwarenessUpdate(from, clients), AW_RELAY);
    },
  );
}
relayAwareness(awA, awB);
relayAwareness(awB, awA);

// ── Minimal in-memory provider (no network) ─────────────────────────────
type Cb = (...args: unknown[]) => void;
function createProvider(awareness: Awareness): Provider {
  const listeners = new Map<string, Set<Cb>>();
  const on = (type: string, cb: Cb) => {
    const set = listeners.get(type) ?? new Set<Cb>();
    set.add(cb);
    listeners.set(type, set);
  };
  return {
    awareness,
    connect: () => {
      listeners.get('status')?.forEach((cb) => cb({ status: 'connected' }));
      listeners.get('sync')?.forEach((cb) => cb(true));
    },
    disconnect: () => {},
    on,
    off: (type: string, cb: Cb) => listeners.get(type)?.delete(cb),
  } as unknown as Provider;
}
const provA = createProvider(awA);
const provB = createProvider(awB);

const factory =
  (doc: Y.Doc, provider: Provider) =>
  (id: string, docMap: Map<string, Y.Doc>): Provider => {
    docMap.set(id, doc);
    return provider;
  };

// ── Presence as an effector store (fed from awareness) ──────────────────
const presenceChanged = createEvent<Peer[]>();
const $presence = createStore<Peer[]>([]).on(presenceChanged, (_, p) => p);
awA.on('change', () =>
  presenceChanged(
    [...awA.getStates().values()]
      .map((s) => ({ name: s.name as string, color: s.color as string }))
      .filter((s) => Boolean(s.name)),
  ),
);

const left = createEditorModel({
  namespace: 'collab-left',
  onError: (e) => {
    throw e;
  },
});
const right = createEditorModel({
  namespace: 'collab-right',
  onError: (e) => {
    throw e;
  },
});

function Presence() {
  const peers = useUnit($presence);
  return (
    <div className="collab-presence">
      {peers.map((p) => (
        <span
          key={p.name}
          className="collab-chip"
          style={{ background: p.color }}
        >
          {p.name}
        </span>
      ))}
      {peers.length === 0 && <span className="collab-muted">no one yet</span>}
    </div>
  );
}

function Pane({
  model,
  user,
  id,
  doc,
  provider,
  bootstrap,
}: {
  model: typeof left;
  user: Peer;
  id: string;
  doc: Y.Doc;
  provider: Provider;
  bootstrap: boolean;
}) {
  const chars = useUnit(model.$text).length;
  return (
    <div className="collab-pane">
      <div className="collab-head">
        <span className="collab-chip" style={{ background: user.color }}>
          {user.name}
        </span>
        {chars} chars
      </div>
      <EditorProvider model={model}>
        <div className="collab-input-wrap">
          <RichTextPlugin
            contentEditable={<ContentEditable className="collab-input" />}
            placeholder={<div className="collab-ph">Type here…</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <CollaborationPlugin
            id={id}
            providerFactory={factory(doc, provider)}
            shouldBootstrap={bootstrap}
            username={user.name}
            cursorColor={user.color}
          />
        </div>
      </EditorProvider>
    </div>
  );
}

export function CollabDemo() {
  return (
    <div>
      <Presence />
      <div className="collab-grid">
        <Pane
          model={left}
          user={USERS.a}
          id="collab-a"
          doc={docA}
          provider={provA}
          bootstrap
        />
        <Pane
          model={right}
          user={USERS.b}
          id="collab-b"
          doc={docB}
          provider={provB}
          bootstrap={false}
        />
      </div>
    </div>
  );
}
