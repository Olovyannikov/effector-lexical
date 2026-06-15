# Совместное редактирование (Yjs)

Реал-тайм коллаборация в Lexical — это штатный плагин `@lexical/react`
(`CollaborationPlugin`), и он работает внутри `<EditorProvider>` без изменений
(провайдер кладёт редактор в `LexicalComposerContext`, откуда плагин его и
берёт). Задача effector — **состояние подключения** вокруг провайдера.

Два независимых редактора ниже (у каждого свой `createEditorModel`) делят один
in-memory `Y.Doc` — печатайте в любом и смотрите, как они синхронизируются, без
сервера:

<LexicalCollab />

```bash
pnpm add yjs y-websocket
```

## Состояние подключения как сторы effector

Прокиньте события Yjs-провайдера в сторы, чтобы остальное приложение (бейдж
статуса, присутствие, индикатор «сохраняется…») оставалось декларативным.

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

## Рендер

Используйте `CollaborationPlugin` **вместо** `HistoryPlugin` — он владеет
документом (undo/redo в комплекте) и бутстрапит начальное состояние. Редактор
модели должен стартовать пустым (это дефолт).

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

// где угодно:
const status = useUnit($status); // 'connecting' | 'connected' | 'disconnected'
```

Сторы модели продолжают работать: `$text`, `$json`, `updated` отражают и
удалённые правки, потому что они питаются листенерами редактора — независимо от
того, кто внёс изменение.

::: tip Рабочий пример
[`examples/react-collab`](https://github.com/Olovyannikov/effector-lexical/tree/main/examples/react-collab)
— полноценное приложение (откройте в двух вкладках, чтобы увидеть синхронизацию)
на публичном сервере `wss://demos.yjs.dev`. Для продакшена поднимите свой
[`y-websocket`](https://github.com/yjs/y-websocket).
:::
