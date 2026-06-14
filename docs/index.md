---
layout: home

hero:
  name: effector-lexical
  text: Effector bindings for Lexical
  tagline: Drive the Lexical editor with stores, events and effects — no imperative glue.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Olovyannikov/effector-lexical

features:
  - title: Listeners → events
    details: Every Lexical listener (update, text, editable, root, mutation) is exposed as an effector event.
  - title: State as stores
    details: $text, $state, $json and $editable are plain stores you can combine, sample and watch.
  - title: Commands as units
    details: Bind any LexicalCommand to dispatch/observe effector units with one call.
  - title: Framework-agnostic core
    details: The core owns the editor and works headless. React bindings are a thin, optional layer.
---

## Try it live

The editor below is driven entirely through effector — the toolbar buttons are
events, undo/redo state comes from `$canUndo`/`$canRedo`, and the counter reads
the `$text` store.

<LexicalDemo />
