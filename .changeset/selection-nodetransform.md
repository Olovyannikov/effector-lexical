---
'effector-lexical': minor
---

Add a `$selection` store (a safe `{ isCollapsed, isBackward, text }` snapshot of
the current range selection) and a `nodeTransform(NodeClass, fn)` helper that
registers a Lexical node transform tracked by `destroy()`.
