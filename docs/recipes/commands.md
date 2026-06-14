# Commands & toolbar

## Bind a built-in command

`command(cmd)` returns `{ dispatch, triggered }`. `dispatch` is an
`EventCallable` — call it to dispatch the command on the editor.

```ts
import { FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical';

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);

// A ready-to-use zero-arg event per format:
export const bold = format.dispatch.prepend(() => 'bold' as const);
export const italic = format.dispatch.prepend(() => 'italic' as const);
export const underline = format.dispatch.prepend(() => 'underline' as const);
```

```tsx
const [onBold, onItalic] = useUnit([bold, italic]);
<button onClick={() => onBold()}>B</button>
<button onClick={() => onItalic()}>I</button>
```

## Undo / redo

```ts
import { UNDO_COMMAND, REDO_COMMAND } from 'lexical';

export const undo = editor.command<void>(UNDO_COMMAND).dispatch;
export const redo = editor.command<void>(REDO_COMMAND).dispatch;
```

Pair with `<HistoryPlugin />` (or register history yourself).

## Observe a command (analytics, side effects)

`triggered` fires whenever the command is dispatched and never consumes it.

```ts
const link = editor.command(TOGGLE_LINK_COMMAND);

sample({ clock: link.triggered, target: trackLinkToggleFx });
```

## Define and dispatch a custom command

```ts
import { createCommand, type LexicalCommand } from 'lexical';

export const INSERT_EMOJI: LexicalCommand<string> =
  createCommand('INSERT_EMOJI');

const emoji = editor.command(INSERT_EMOJI);

// React to it inside an update:
sample({ clock: emoji.triggered, target: insertEmojiFx });

// Dispatch from the UI:
export const insertEmoji = emoji.dispatch; // insertEmoji('🎉')
```

## Run a command at a custom priority

```ts
import { COMMAND_PRIORITY_HIGH } from 'lexical';

const enter = editor.command(KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH);
```

## Keyboard shortcuts

Commands are how Lexical models shortcuts. Bind the command and trigger
`dispatch` from your key handler, or rely on Lexical's built-in key commands and
just observe them:

```ts
const save = editor.command<KeyboardEvent | null>(KEY_MODIFIER_COMMAND);
sample({ clock: save.triggered, filter: isSaveShortcut, target: saveFx });
```

## Toggle a format and reflect the active state

See [Selection & formatting](./selection) for computing whether the current
selection is bold/italic so the toolbar button can show an active state.
