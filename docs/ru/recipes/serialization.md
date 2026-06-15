# HTML и Markdown

Сериализация редактора в HTML/Markdown и обратно — как effector-эффекты. Они
вынесены в отдельные энтрипоинты, чтобы соответствующие пакеты Lexical
оставались опциональными:

::: code-group

```bash [HTML]
pnpm add @lexical/html
```

```bash [Markdown]
pnpm add @lexical/markdown
```

:::

## HTML

```ts
import { createHtmlApi } from 'effector-lexical/html';

const { exportHtmlFx, importHtmlFx } = createHtmlApi(editor);

// экспорт → строка
const html = await exportHtmlFx();

// импорт (заменяет контент)
await importHtmlFx('<p>hello <strong>world</strong></p>');
```

| Юнит           | Тип                    | Описание                            |
| -------------- | ---------------------- | ----------------------------------- |
| `exportHtmlFx` | `Effect<void, string>` | Текущий контент → HTML-строка.      |
| `importHtmlFx` | `Effect<string, void>` | Распарсить HTML и заменить контент. |

## Markdown

`createMarkdownApi` принимает опциональные `transformers` (по умолчанию —
`TRANSFORMERS` из Lexical). Передайте свои под ноды, которые регистрирует ваш
редактор.

```ts
import { createMarkdownApi } from 'effector-lexical/markdown';

const { exportMarkdownFx, importMarkdownFx } = createMarkdownApi(editor);

const md = await exportMarkdownFx();
await importMarkdownFx('# Title\n\nsome **bold** text');
```

| Юнит               | Тип                    | Описание                                |
| ------------------ | ---------------------- | --------------------------------------- |
| `exportMarkdownFx` | `Effect<void, string>` | Текущий контент → Markdown-строка.      |
| `importMarkdownFx` | `Effect<string, void>` | Распарсить Markdown и заменить контент. |

## Связка с остальным

Оба — обычные эффекты, комбинируйте их через `sample` как любые другие.
Загрузка с сервера, автосейв в Markdown, экспорт по кнопке:

```ts
import { sample } from 'effector';

// сервер вернул HTML → импортируем
sample({ clock: loadHtmlFx.doneData, target: importHtmlFx });

// автосейв в Markdown с дебаунсом
sample({ clock: debounce(editor.updated, 800), target: exportMarkdownFx });
sample({ clock: exportMarkdownFx.doneData, target: saveMarkdownFx });
```

::: tip Зарегистрированные ноды
Импорт создаёт только те ноды, которые известны редактору. Зарегистрируйте
соответствующие ноды (`HeadingNode`, `ListNode`, `LinkNode`, …) в
`createEditorModel({ nodes })`, а для Markdown — передайте трансформеры под них.
:::

## Live-шорткаты Markdown (набрал `# ` → заголовок)

Чтобы форматировать Markdown **прямо при вводе** (`# ` → H1, `- ` → список,
`**bold**`), используйте штатный `MarkdownShortcutPlugin` из Lexical внутри
`<EditorProvider>` — это обычный Lexical-плагин, обвязка effector не нужна:

```tsx
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';

<EditorProvider model={editor}>
  <RichTextPlugin /* … */ />
  <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
</EditorProvider>;
```

Те же `transformers` питают шорткаты, `importMarkdownFx` и `exportMarkdownFx` —
держите один список, чтобы все трое были согласованы. Зарегистрируйте ноды, что
нужны трансформерам (`HeadingNode`, `ListNode`, `QuoteNode`, `CodeNode`,
`LinkNode`, …).

Вставка целого Markdown-документа — другое: плагин шорткатов реагирует только на
ввод, а `$convertFromMarkdownString` заменяет **весь** документ. Для «вставил
markdown → сконвертировалось» используйте [тоггл Markdown-исходника](/playground)
(`importMarkdownFx`), а не вставку по месту.
