# Installation

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

## Peer dependencies

`effector` and `lexical` are required peers. For the React bindings, also install:

```bash
pnpm add react @lexical/react
```

`react` and `@lexical/react` are **optional** peers — you only need them when you
import from `effector-lexical/react`.

| Package          | Required for             | Min version |
| ---------------- | ------------------------ | ----------- |
| `effector`       | core                     | `>=23`      |
| `lexical`        | core                     | `>=0.40`    |
| `react`          | `effector-lexical/react` | `>=18`      |
| `@lexical/react` | `effector-lexical/react` | `>=0.40`    |

## Entry points

```ts
// Framework-agnostic core
import { createEditorModel } from 'effector-lexical';

// React adapter
import { EditorProvider, useEditorModel } from 'effector-lexical/react';
```
