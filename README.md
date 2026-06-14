# effector-lexical

> Effector bindings for the [Lexical](https://lexical.dev) text editor.

[![npm](https://img.shields.io/npm/v/effector-lexical.svg)](https://www.npmjs.com/package/effector-lexical)
[![CI](https://github.com/Olovyannikov/effector-lexical/actions/workflows/ci.yml/badge.svg)](https://github.com/Olovyannikov/effector-lexical/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Olovyannikov/effector-lexical/branch/main/graph/badge.svg)](https://codecov.io/gh/Olovyannikov/effector-lexical)
[![minzip](https://img.shields.io/bundlephobia/minzip/effector-lexical)](https://bundlephobia.com/package/effector-lexical)
[![license](https://img.shields.io/npm/l/effector-lexical.svg)](./LICENSE)

Drive Lexical with stores, events and effects instead of imperative listener
glue. Lexical listeners become effector **events**, the editor state is mirrored
into **stores**, and edits/commands go out through **effects** — with no leaks
(the model owns every subscription).

📖 **[Documentation & recipes](https://olovyannikov.github.io/effector-lexical/)**

## Install

```bash
pnpm add effector-lexical effector lexical
# for the React bindings:
pnpm add react @lexical/react
```

`effector` and `lexical` are required peers; `react` and `@lexical/react` are
optional (only needed for `effector-lexical/react`).

## Quick start

```ts
// model.ts
import { createEditorModel } from 'effector-lexical';
import { FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical';

export const editor = createEditorModel({
  namespace: 'my-editor',
  onError: (e) => {
    throw e;
  },
});

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
export const formatBold = format.dispatch.prepend(() => 'bold' as const);
```

```tsx
// App.tsx
import { useUnit } from 'effector-react';
import { EditorProvider } from 'effector-lexical/react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { editor, formatBold } from './model';

export function App() {
  const onBold = useUnit(formatBold);
  const text = useUnit(editor.$text);
  return (
    <EditorProvider model={editor}>
      <button onClick={() => onBold()}>Bold</button>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div>Type…</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <p>{text.length} chars</p>
    </EditorProvider>
  );
}
```

`<EditorProvider>` replaces `<LexicalComposer>` — it injects the model's editor
into `LexicalComposerContext`, so all standard `@lexical/react` plugins work
unchanged.

## API at a glance

| Unit                                                       | Kind     | Description                                      |
| ---------------------------------------------------------- | -------- | ------------------------------------------------ |
| `editor`, `$instance`                                      | instance | The owned `LexicalEditor`.                       |
| `updated`, `textChanged`, `editableChanged`, `rootChanged` | events   | Lexical listeners as effector events.            |
| `$state`, `$text`, `$json`, `$editable`                    | stores   | Mirrored editor state.                           |
| `updateFx`, `setStateFx`, `focusFx`, `blurFx`              | effects  | effector → Lexical.                              |
| `read`, `command`, `mutations`, `destroy`                  | helpers  | Sync read, command binding, mutations, teardown. |

Full reference: [Core API](https://olovyannikov.github.io/effector-lexical/api/core) ·
[React API](https://olovyannikov.github.io/effector-lexical/api/react).

## Headless

The core is framework-agnostic and works without React — ideal for tests and
server-side parsing. See the [headless example](https://olovyannikov.github.io/effector-lexical/examples).

## Development

```bash
pnpm install
pnpm build         # bundle + d.ts
pnpm test          # vitest
pnpm test:coverage # vitest + coverage
pnpm docs:dev      # local docs
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [SPEC.md](./SPEC.md).

## License

[MIT](./LICENSE) © Olovyannikov
