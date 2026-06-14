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

## Про точки за пробелы и стрелки переноса

Показать `·` за **каждый пробел** (как в Word) или `↵` за мягкие переносы строк
**чистым CSS в Lexical надёжно нельзя**: неформатированный отрезок текста — это
один DOM-текстовый узел, поэтому нет отдельного элемента на каждый пробел, а у
`<br>` нет сгенерированного контента. К тому же Lexical владеет DOM, так что
вставленные извне span-маркеры будут перетёрты при следующей реконсиляции.

Единственный способ, сохраняющий контент, — **node-transform**, который делит
пробелы на `token`-узлы (каждый рендерится своим `<span>`), чтобы CSS мог их
пометить:

```ts
import { TextNode } from 'lexical';

// Изолируем пробельный отрезок в token-узел, помеченный для CSS.
editor.editor.registerNodeTransform(TextNode, (node) => {
  if (!$marks.getState() || node.getMode() === 'token') return;
  const text = node.getTextContent();
  const i = text.indexOf(' ');
  if (i === -1) return;
  const space = i === 0 ? node : node.splitText(i)[1];
  space.setMode('token').setStyle('--ws:1');
});
```

```css
.editor.marks-on [style*='--ws'] {
  position: relative;
  color: transparent;
}
.editor.marks-on [style*='--ws']::before {
  content: '·';
  position: absolute;
  inset: 0;
  color: var(--mark-color);
  text-align: center;
}
```

::: warning Компромисс
Разбиение каждого пробела на token-узлы меняет структуру нод и влияет на
движение каретки, выделение и копирование/вставку. Это нормально для
преимущественно read-only представления, но для основной поверхности
редактирования лучше блочные `¶`-маркеры выше. Трансформер считайте
экспериментальным.
:::
