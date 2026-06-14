# Scope, SSR и тестирование

## Заметка о scope (прочитайте это перед использованием `fork`)

`LexicalEditor` — это единый, изменяемый, **несериализуемый** объект, живущий
вне effector. Модель связывает его листенеры с effector, вызывая события
напрямую из колбэков Lexical:

```ts
editor.registerUpdateListener((payload) => {
  updated(payload); // ← fired from Lexical, outside any effector scope
});
```

Поскольку эти эмиссии происходят **вне scope effector**, они попадают в
**глобальные** состояния сторов, а не в копии форкнутого scope. Если вы
рендерите внутри `<Provider value={scope}>` и читаете через `useUnit`, сторы,
управляемые листенерами (`$state`, `$text`, `$editable`, `$json`), **не** будут
отражать правки, сделанные в редакторе.

Это осознанный компромисс v0: экземпляр редактора нельзя сериализовать или
продублировать на каждый scope, поэтому изоляция через `fork` на каждый запрос к
нему не применяется. См. `SPEC.md` → _Non-goals_.

### Рекомендация

- **Клиентские приложения:** используйте модель в **глобальном scope** (без
  `Provider value` вокруг поддерева редактора или примите тот факт, что
  собственные сторы редактора глобальны). Всё в этом руководстве работает как
  написано.
- **SSR:** используйте редактор в режиме **headless** для парсинга/генерации
  состояния, а не как реактивный стор, привязанный к scope (следующий раздел).
- **Если вам нужна реактивность, привязанная к scope**, откройте issue —
  вариант с привязкой к scope (`attachToScope(scope)`, который перепривязывает
  эмиттеры через `scopeBind`) есть в роадмапе.

## Серверный рендеринг (headless)

Ядро работает без DOM, что идеально подходит для превращения сохранённого JSON в
HTML на сервере. Lexical поставляет headless-пакет для `createEditor` без
браузерных API; модель оборачивает его таким же образом.

```ts
import { createEditorModel } from 'effector-lexical';

const editor = createEditorModel({ namespace: 'ssr', onError: console.error });

// Load serialized state and read derived data — no scope, no DOM.
await editor.setStateFx(jsonFromDatabase);
const text = editor.$text.getState();

editor.destroy();
```

## Тестирование модели (headless)

Ни React, ни scope не требуются — управляйте моделью и проверяйте состояния
сторов.

```ts
import { describe, it, expect } from 'vitest';
import { createEditorModel } from 'effector-lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

describe('my editor model', () => {
  it('mirrors text into $text', async () => {
    const editor = createEditorModel({
      namespace: 'test',
      onError: (e) => {
        throw e;
      },
    });

    await editor.updateFx(() => {
      const root = $getRoot();
      root.clear();
      root.append($createParagraphNode().append($createTextNode('hello')));
    });

    expect(editor.$text.getState()).toBe('hello');
    editor.destroy();
  });
});
```

Создавайте свежую модель на каждый тест для изоляции и вызывайте `destroy()` в
teardown, чтобы удалить каждый листенер Lexical.

## Очистка

Когда модель одноразовая (например, редактор на конкретный маршрут),
освобождайте листенеры:

```ts
// React
useEffect(() => () => editor.destroy(), []);
```
