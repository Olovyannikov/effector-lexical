import { createEvent, createStore } from 'effector';
import { createEditorModel } from 'effector-lexical';
import type { Provider } from '@lexical/yjs';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Public y-websocket demo server — fine for a quick try, run your own for real.
const WS_URL = 'wss://demos.yjs.dev';
export const ROOM = 'effector-lexical-collab-demo';

// CollaborationPlugin manages the document, so start the editor empty.
export const editor = createEditorModel({
  namespace: 'collab',
  onError: (error) => {
    throw error;
  },
});

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

const statusChanged = createEvent<ConnectionStatus>();
const peersChanged = createEvent<number>();

export const $status = createStore<ConnectionStatus>('disconnected').on(
  statusChanged,
  (_, status) => status,
);
export const $peers = createStore(1).on(peersChanged, (_, n) => n);

/** Provider factory wired to effector stores (connection status + peer count). */
export function providerFactory(
  id: string,
  yjsDocMap: Map<string, Y.Doc>,
): Provider {
  let doc = yjsDocMap.get(id);
  if (doc === undefined) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  const provider = new WebsocketProvider(WS_URL, id, doc, { connect: false });
  provider.on('status', (event: { status: ConnectionStatus }) =>
    statusChanged(event.status),
  );
  provider.awareness.on('change', () =>
    peersChanged(provider.awareness.getStates().size),
  );

  return provider as unknown as Provider;
}
