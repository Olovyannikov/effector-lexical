# Показать символы форматирования

Тоггл «показать символы» в стиле Word: управляется стором effector и
применяется к редактору небольшим переиспользуемым плагином.

## Стор

```ts
import { createEvent, createStore } from 'effector';

export const toggleMarks = createEvent();
export const $marks = createStore(false).on(toggleMarks, (on) => !on);
```

## Плагин

Плагин отражает `$marks` на **корневой элемент** редактора в виде класса и
переприменяет его при смене корневого элемента. Остальное делает CSS.

```tsx
import { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { useEditorInstance } from 'effector-lexical/react';
import { $marks } from './marks';

export function FormattingMarksPlugin() {
  const on = useUnit($marks);
  const editor = useEditorInstance();
  useEffect(() => {
    const apply = (root: HTMLElement | null) =>
      root?.classList.toggle('marks-on', on);
    apply(editor.getRootElement());
    return editor.registerRootListener(apply);
  }, [editor, on]);
  return null;
}
```

Поставьте рядом с остальными плагинами:

```tsx
<EditorProvider model={editor}>
  <RichTextPlugin /* … */ />
  <FormattingMarksPlugin />
</EditorProvider>
```

## CSS

Показываем pilcrow в конце каждого блока. Пустые блоки рендерят одиночный `<br>`
— прячем его, чтобы `¶` оставался на той же строке, а не уходил на следующую.

```css
.editor.marks-on :where(p, h1, h2, blockquote, li)::after {
  content: '¶';
  opacity: 0.5;
}
.editor.marks-on :where(p, h1, h2, blockquote, li) > br:only-child {
  display: none;
}
```

## Почему точек за пробелы и `↵` здесь нет

Показать `·` за **каждый пробел** (как в Word) или `↵` за мягкие переносы строк
кажется простым, но на **редактируемой** поверхности Lexical это ненадёжно:

- Неформатированный отрезок текста — это **один DOM-текстовый узел**, отдельного
  элемента на каждый пробел нет, а Lexical владеет DOM, так что вставленные
  извне span-маркеры перетираются при следующей реконсиляции.
- У `<br>` (LineBreakNode) **нет надёжного сгенерированного контента** в разных
  браузерах, поэтому `br::after { content: '↵' }` работает нестабильно.

Соблазнительный «фикс» — node-transform, делящий каждый пробел в `token`-узел с
инлайн-`style`/`format` для CSS — **ломает ввод**: Lexical **наследует `format` и
`style` узла на вновь набираемый текст**, поэтому символы после помеченного
пробела наследуют маркер и становятся невидимыми. (Мы пробовали — не надо.)

Единственный корректный путь — **отдельный тип узла**: подкласс `TextNode`, чей
`createDOM` добавляет настоящий `class` (не `format`/`style`, которые
наследуются), зарегистрированный через замену узла, плюс transform, который
превращает пробелы в него и обратно. Это заметный объём кода и всё равно есть
краевые случаи с выделением/буфером обмена, поэтому здесь это вне рамок.

Для основной поверхности редактирования лучше блочные `¶`-маркеры выше — они
надёжны и соответствуют модели Word: **Enter** завершает абзац (`¶`),
**Shift+Enter** вставляет перенос строки.
