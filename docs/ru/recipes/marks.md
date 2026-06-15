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
    // Должен возвращать void — Lexical трактует возврат root-листенера как
    // teardown-функцию, а classList.toggle возвращает boolean.
    const apply = (root: HTMLElement | null) => {
      root?.classList.toggle('marks-on', on);
    };
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

## Точки за пробелы (кастомный узел)

Показать `·` за **каждый пробел** одним CSS нельзя: неформатированный отрезок
текста — это один DOM-текстовый узел, отдельного элемента на пробел нет. Наивный
«фикс» — transform, помечающий пробелы инлайн-`style`/`format` — **ломает ввод**,
потому что Lexical **наследует `format`/`style` узла на вновь набираемый текст**,
и символы после помеченного пробела наследуют маркер и становятся невидимыми.

Надёжный путь — **отдельный тип узла**: маркер живёт в **типе** узла и настоящем
`class` (ни то, ни другое не наследуется при вводе), поэтому новый текст — это
обычный `TextNode` и остаётся видимым.

```ts
import { TextNode, type EditorConfig } from 'lexical';

export class WhitespaceNode extends TextNode {
  static getType() {
    return 'whitespace';
  }
  static clone(n: WhitespaceNode) {
    return new WhitespaceNode(n.__text, n.__key);
  }
  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.classList.add('ws-mark'); // class, не format/style → не наследуется
    return dom;
  }
  // держим узел одиночным пробелом; набранный текст уходит в соседние узлы
  canInsertTextBefore() {
    return false;
  }
  canInsertTextAfter() {
    return false;
  }
}
```

Transform превращает пробелы в `WhitespaceNode`, пока тогл включён, и
возвращает обратно при выключении (соседний transform на `WhitespaceNode`
делает из него обычный `TextNode`, который затем сливается). CSS сохраняет
реальный пробел (для копирования) и рисует точку:

```css
.editor.marks-on .ws-mark {
  position: relative;
  color: transparent;
}
.editor.marks-on .ws-mark::before {
  content: '·';
  position: absolute;
  inset: 0;
  text-align: center;
}
```

Полная реализация (узел, трансформы и хелпер `refresh` для переобработки
контента на тогл) — в исходниках плейграунда:
[`showInvisibles.ts`](https://github.com/Olovyannikov/effector-lexical/blob/main/docs/.vitepress/theme/demo/showInvisibles.ts).
Попробуйте на [Playground](/playground) тоглом ¶.

::: warning Без `↵` для переносов
Глиф для мягких переносов (`↵`) потребовал бы обернуть `<br>` в элемент — а это
**ломает маппинг каретки** в Lexical (нельзя печатать перед переносом). Поэтому
переносы остаются обычным `<br>`; концы абзацев — это CSS-only `¶` выше.
**Enter** завершает абзац (`¶`); **Shift+Enter** вставляет обычный перенос.
:::
