# React API

```ts
import {
  EditorProvider,
  useEditorModel,
  useEditorInstance,
} from 'effector-lexical/react';
```

React-слой намеренно сделан тонким. Модель уже владеет редактором, поэтому
единственная задача провайдера — внедрить этот редактор в `LexicalComposerContext`,
что заставляет каждый стандартный плагин `@lexical/react` (`RichTextPlugin`,
`PlainTextPlugin`, `ContentEditable`, `HistoryPlugin`, `ListPlugin`, …) работать
без изменений.

## `<EditorProvider model>`

Используйте его **вместо** `<LexicalComposer>`.

| Проп       | Тип           | Описание                       |
| ---------- | ------------- | ------------------------------ |
| `model`    | `EditorModel` | Модель из `createEditorModel`. |
| `children` | `ReactNode`   | Плагины Lexical и ваш UI.      |

```tsx
<EditorProvider model={editor}>
  <RichTextPlugin
    contentEditable={<ContentEditable />}
    placeholder={<div>Type…</div>}
    ErrorBoundary={LexicalErrorBoundary}
  />
  <HistoryPlugin />
</EditorProvider>
```

Тема, переданная в `createEditorModel`, пробрасывается в контекст композера,
поэтому имена классов на основе темы работают так же, как и с `LexicalComposer`.

## `useEditorModel()`

Возвращает `EditorModel` из ближайшего провайдера. Бросает исключение при использовании вне
`<EditorProvider>`.

```tsx
function CharCount() {
  const { $text } = useEditorModel();
  return <span>{useUnit($text).length}</span>;
}
```

## `useEditorInstance()`

Сокращение для `useEditorModel().editor` — сырой `LexicalEditor`, удобно, когда
сторонний плагин ожидает экземпляр напрямую.

::: tip Чтение сторов
Этот пакет не включает `effector-react`. Читайте сторы с помощью `useUnit` из
`effector-react` или подписывайтесь вручную через `store.watch`.
:::
