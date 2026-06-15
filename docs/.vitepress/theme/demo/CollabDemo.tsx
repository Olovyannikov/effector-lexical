// In-page collaboration: two independent editors (each its own effector model)
// bound to ONE shared Y.Doc — edits sync in-memory, no server.
import { useUnit } from 'effector-react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import type { Provider } from '@lexical/yjs';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import { createEditorModel } from '../../../../src';
import { EditorProvider } from '../../../../src/react';

const ROOM = 'effector-lexical-inpage';

// The single shared document both editors bind to.
const sharedDoc = new Y.Doc();

// Provider only satisfies the API + awareness; it never connects (no network).
// Both editors bind to `sharedDoc`, so Yjs syncs them in-memory.
function providerFactory(id: string, docMap: Map<string, Y.Doc>): Provider {
  docMap.set(id, sharedDoc);
  const provider = new WebsocketProvider('wss://localhost', id, sharedDoc, {
    connect: false,
  });
  return provider as unknown as Provider;
}

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

function Pane({
  model,
  label,
  bootstrap,
}: {
  model: typeof left;
  label: string;
  bootstrap: boolean;
}) {
  const chars = useUnit(model.$text).length;
  return (
    <div className="collab-pane">
      <div className="collab-head">
        {label} · {chars} chars
      </div>
      <EditorProvider model={model}>
        <div className="collab-input-wrap">
          <RichTextPlugin
            contentEditable={<ContentEditable className="collab-input" />}
            placeholder={<div className="collab-ph">Type here…</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <CollaborationPlugin
            id={ROOM}
            providerFactory={providerFactory}
            shouldBootstrap={bootstrap}
          />
        </div>
      </EditorProvider>
    </div>
  );
}

export function CollabDemo() {
  return (
    <div className="collab-grid">
      <Pane model={left} label="Editor A" bootstrap />
      <Pane model={right} label="Editor B" bootstrap={false} />
    </div>
  );
}
