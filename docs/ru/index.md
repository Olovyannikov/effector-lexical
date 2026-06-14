---
layout: home

hero:
  name: effector-lexical
  text: Effector-биндинги для Lexical
  tagline: Управляйте редактором Lexical с помощью сторов, событий и эффектов — без императивного связующего кода.
  actions:
    - theme: brand
      text: Начать
      link: /ru/guide/getting-started
    - theme: alt
      text: Посмотреть на GitHub
      link: https://github.com/Olovyannikov/effector-lexical

features:
  - title: Листенеры → события
    details: Каждый листенер Lexical (update, text, editable, root, mutation) предоставляется как событие effector.
  - title: Состояние как сторы
    details: $text, $state, $json и $editable — это обычные сторы, которые можно комбинировать, использовать в sample и наблюдать.
  - title: Команды как юниты
    details: Привяжите любую LexicalCommand к диспатчу/наблюдению юнитов effector одним вызовом.
  - title: Framework-agnostic ядро
    details: Ядро владеет редактором и работает в headless-режиме. React-биндинги — это тонкий, опциональный слой.
---

## Попробуйте вживую

Редактор ниже управляется целиком через effector — кнопки тулбара это события,
доступность undo/redo берётся из `$canUndo`/`$canRedo`, а счётчик читает стор
`$text`.

<LexicalDemo />
