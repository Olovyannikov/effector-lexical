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

## Вставка Markdown → конвертация по месту курсора

Плагин шорткатов реагирует только на ввод, а `$convertFromMarkdownString`
заменяет **весь** документ — поэтому чтобы конвертировать _вставленный_ Markdown
по месту, перехватите `PASTE_COMMAND`, соберите ноды во временном редакторе и
вставьте их в селекцию через `@lexical/clipboard`:

```ts
import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
  $insertGeneratedNodes,
} from '@lexical/clipboard';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import {
  createEditor,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';

const toNodesJSON = (md: string) => {
  const temp = createEditor({
    nodes: NODES,
    onError: (e) => {
      throw e;
    },
  });
  let nodes = [];
  temp.update(
    () => {
      $convertFromMarkdownString(md, TRANSFORMERS);
      const root = $getRoot();
      nodes = $generateJSONFromSelectedNodes(
        temp,
        root.select(0, root.getChildrenSize()),
      ).nodes;
    },
    { discrete: true },
  );
  return nodes;
};

editor.editor.registerCommand(
  PASTE_COMMAND,
  (event) => {
    if (!(event instanceof ClipboardEvent)) return false;
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!looksLikeMarkdown(text)) return false; // обычная вставка остаётся как есть
    event.preventDefault();
    const serialized = toNodesJSON(text);
    editor.editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $insertGeneratedNodes(
        editor.editor,
        $generateNodesFromSerializedNodes(serialized),
        selection,
      );
    });
    return true;
  },
  COMMAND_PRIORITY_HIGH,
);
```

Временный редактор должен регистрировать **те же ноды**, что и основной.
`$generateJSONFromSelectedNodes` сериализует ноды **вместе с детьми** (голый
`node.exportJSON()` — нет), а `$insertGeneratedNodes` — это то, что использует
родной rich-paste Lexical: один блок сливается с текущим, несколько вставляются
как соседние, как при обычной вставке. Закройте это проверкой «похоже на
Markdown», чтобы обычный текст оставался текстом. Вживую — в
[Playground](/playground).
