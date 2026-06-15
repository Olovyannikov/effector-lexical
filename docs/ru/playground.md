# Playground

Более богатый редактор — заголовки, цитаты, маркированные/нумерованные списки,
ссылки и inline-форматирование, с полноценной историей. Всё, что вы видите в
тулбаре, управляется effector:

- кнопки это **события**, привязанные через `useUnit`;
- **активный** формат и текущий **тип блока** берутся из стора, производного от
  события `updated` (см. [Выделение и форматирование](./recipes/selection));
- доступность undo/redo — это `$canUndo` / `$canRedo` из `history()`;
- счётчики в футере читают стор `$text`;
- кнопка **MD** переключает на исходник в Markdown — `exportMarkdownFx`
  выгружает контент при входе, `importMarkdownFx` применяет правки при возврате
  (см. [HTML и Markdown](./recipes/serialization));
- **live-шорткаты Markdown** — наберите `# `, `- `, `> `, ` ``` ` или
  `**bold**`, и форматирование применится прямо при вводе (плагин Lexical
  `MarkdownShortcutPlugin`);
- **вставка Markdown** — вставьте текст, похожий на Markdown, и он
  сконвертируется в ноды по месту курсора (`PASTE_COMMAND` + `@lexical/clipboard`).

<LexicalPlayground />

Модель регистрирует rich-text ноды и привязывает команды:

```ts
const editor = createEditorModel({
  namespace: 'playground',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
  onError: (e) => {
    throw e;
  },
});

const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
const bold = format.dispatch.prepend(() => 'bold' as const);

const setBlockFx = attach({
  effect: editor.updateFx,
  mapParams: (create: () => ElementNode) => () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) $setBlocksType(selection, create);
  },
});
const toH1 = setBlockFx.prepend(() => () => $createHeadingNode('h1'));

const { $canUndo, $canRedo, undo, redo } = editor.history();
```

Рендерится стандартными плагинами `@lexical/react` внутри `<EditorProvider>`
(`RichTextPlugin`, `HistoryPlugin`, `ListPlugin`, `LinkPlugin`). Полный набор —
в [API ядра](./api/core) и [React API](./api/react).
