# Команды и тулбар

## Привязка встроенной команды

`command(cmd)` возвращает `{ dispatch, triggered }`. `dispatch` — это
`EventCallable`: вызовите его, чтобы задиспатчить команду в редакторе.

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

Используйте вместе с `<HistoryPlugin />` (или зарегистрируйте историю
самостоятельно).

## Наблюдение за командой (аналитика, побочные эффекты)

`triggered` срабатывает каждый раз, когда команда диспатчится, и никогда её не
поглощает.

```ts
const link = editor.command(TOGGLE_LINK_COMMAND);

sample({ clock: link.triggered, target: trackLinkToggleFx });
```

## Определение и диспатч собственной команды

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

## Запуск команды с собственным приоритетом

```ts
import { COMMAND_PRIORITY_HIGH } from 'lexical';

const enter = editor.command(KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH);
```

## Клавиатурные сокращения

Команды — это то, как Lexical моделирует сокращения. Привяжите команду и
вызывайте `dispatch` из своего обработчика клавиш либо положитесь на встроенные
клавиатурные команды Lexical и просто наблюдайте за ними:

```ts
const save = editor.command<KeyboardEvent | null>(KEY_MODIFIER_COMMAND);
sample({ clock: save.triggered, filter: isSaveShortcut, target: saveFx });
```

## Переключение форматирования и отображение активного состояния

См. [Выделение и форматирование](./selection) для вычисления того, является ли
текущее выделение жирным/курсивным, чтобы кнопка тулбара могла показать активное
состояние.
