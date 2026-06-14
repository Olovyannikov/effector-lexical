# Установка

::: code-group

```bash [pnpm]
pnpm add effector-lexical effector lexical
```

```bash [npm]
npm install effector-lexical effector lexical
```

```bash [yarn]
yarn add effector-lexical effector lexical
```

:::

## Peer-зависимости

`effector` и `lexical` — обязательные peer-зависимости. Для React-биндингов также установите:

```bash
pnpm add react @lexical/react
```

`react` и `@lexical/react` — **опциональные** peer-зависимости: они нужны только тогда, когда вы
импортируете из `effector-lexical/react`.

| Пакет            | Требуется для            | Мин. версия |
| ---------------- | ------------------------ | ----------- |
| `effector`       | ядро                     | `>=23`      |
| `lexical`        | ядро                     | `>=0.40`    |
| `react`          | `effector-lexical/react` | `>=18`      |
| `@lexical/react` | `effector-lexical/react` | `>=0.40`    |

## Точки входа

```ts
// Framework-agnostic ядро
import { createEditorModel } from 'effector-lexical';

// React-адаптер
import { EditorProvider, useEditorModel } from 'effector-lexical/react';
```
