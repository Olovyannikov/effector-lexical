# Форматы вывода

Lexical умеет выдавать содержимое в четырёх представлениях. У каждого своё
назначение и своя точность обратного преобразования — выбирайте подходящее под
задачу.

## EditorState JSON

Канонический формат. `SerializedEditorState` — это простой объект, описывающий
всё дерево узлов. Он **без потерь и пригоден для хранения** — сохраняйте его,
передавайте по сети и восстанавливайте в точности.

Получить его можно из стора `$json` (модель отображает `$state.toJSON()`):

```ts
const json = editor.$json.getState();
```

…или прочитать по требованию:

```ts
const json = editor.read(() => editor.editor.getEditorState().toJSON());
```

Абзац со словом **world**, выделенным жирным, сериализуется так:

```json
{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Hello ",
            "type": "text",
            "version": 1
          },
          {
            "detail": 0,
            "format": 1,
            "mode": "normal",
            "style": "",
            "text": "world",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}
```

`format: 1` означает **bold** (жирный) — поле `format` у текстового узла является
битовой маской (bold = 1, italic = 2, …), поэтому комбинации складываются.

Восстановите его через `setStateFx` (принимает `EditorState`, сериализованный
объект или JSON-строку):

```ts
await editor.setStateFx(json);
```

## HTML

Через точку входа [`effector-lexical/html`](/ru/recipes/serialization):

```ts
import { createHtmlApi } from 'effector-lexical/html';

const { exportHtmlFx, importHtmlFx } = createHtmlApi(editor);

const html = await exportHtmlFx();
await importHtmlFx('<p>hello <strong>world</strong></p>');
```

Тот же абзац экспортируется примерно в:

```html
<p>
  <span style="white-space: pre-wrap;">Hello </span
  ><strong style="white-space: pre-wrap;">world</strong>
</p>
```

HTML предназначен для **интероперабельности и буфера обмена** (вставка в письмо,
CMS, другой редактор). Он **не** обратим в точности — экспорт с последующим
импортом может потерять специфичные для редактора детали.

## Markdown

Через точку входа [`effector-lexical/markdown`](/ru/recipes/serialization):

```ts
import { createMarkdownApi } from 'effector-lexical/markdown';

const { exportMarkdownFx, importMarkdownFx } = createMarkdownApi(editor);

const md = await exportMarkdownFx(); // "Hello **world**"
await importMarkdownFx('Hello **world**');
```

Markdown — это **редактируемый человеком исходник**, но **с потерями**:
переживает преобразование только то, что покрывают трансформеры. Всё за пределами
их набора отбрасывается.

## Простой текст

Просто прочитайте стор `$text`:

```ts
const text = editor.$text.getState(); // "Hello world"
```

Полезно для поискового индекса, подсчёта символов/слов и превью.

## Сравнение

| Формат           | Как получить                                   | Точность обратного преобразования | Сценарий                                   |
| ---------------- | ---------------------------------------------- | --------------------------------- | ------------------------------------------ |
| EditorState JSON | `$json` / `editor.read(...)`                   | Без потерь                        | Хранение, персистентность, источник истины |
| HTML             | `createHtmlApi(editor).exportHtmlFx()`         | С потерями (для интеропа)         | Интероп, буфер обмена, почта               |
| Markdown         | `createMarkdownApi(editor).exportMarkdownFx()` | С потерями (по трансформерам)     | Редактируемый человеком исходник           |
| Простой текст    | стор `$text`                                   | Односторонне (без структуры)      | Поиск, подсчёты, превью                    |

## См. также

- [Рецепт HTML и Markdown](/ru/recipes/serialization) — обвязка импорта/экспорта,
  вставка, живые сокращения.
- [API ядра](/ru/api/core) — `$json`, `$text`, `setStateFx`, `read`.
