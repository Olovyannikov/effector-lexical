# Что и зачем

[Lexical](https://lexical.dev) — это **императивный** редактор: вы держите изменяемый
экземпляр `LexicalEditor`, подключаете листенеры (`registerUpdateListener`,
`registerTextContentListener`, `registerCommand`, …) и изменяете состояние через
`editor.update(() => …)`. Каждый вызов `register*` возвращает функцию отписки.

[Effector](https://effector.dev) — это **декларативный** мир сторов, событий
и эффектов.

`effector-lexical` — это мост между ними:

- **Входящее** — листенеры Lexical становятся **событиями** effector, а состояние
  редактора зеркалируется в **сторы** (`$text`, `$state`, `$json`, `$editable`).
- **Исходящее** — **эффекты** effector оборачивают `editor.update`, `setEditorState` и
  диспатч команд.

Жизненный цикл всех листенеров Lexical принадлежит модели, поэтому утечек нет:
вызовите `destroy()` — и каждая подписка будет удалена.

## Дизайн в общих чертах

```
                ┌─────────────────────────── EditorModel ───────────────────────────┐
  Lexical  ──►  registerUpdateListener ─► updated ─► $state ─► $json                 │
  listeners     registerTextContent…   ─► textChanged ─► $text                       │
                registerEditableList… ─► editableChanged ─► $editable                │
                                                                                     │
  effector ──►  updateFx  ─► editor.update                                           │
  effects       setStateFx ─► editor.setEditorState                                  │
                command()  ─► editor.registerCommand / dispatchCommand               │
                └─────────────────────────────────────────────────────────────────┘
```

Пакет **core** является framework-agnostic и владеет редактором (он сам вызывает
`createEditor` за вас). Слой **React** — это тонкий адаптер, который внедряет этот
редактор в `LexicalComposerContext`, чтобы стандартные плагины `@lexical/react`
продолжали работать.

Продолжайте с [Установки](./installation) и
[Быстрого старта](./quick-start).
