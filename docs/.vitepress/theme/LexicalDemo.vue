<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';

const host = ref<HTMLElement | null>(null);
let root: { unmount: () => void } | null = null;

onMounted(async () => {
  // Client-only: React + Lexical touch the DOM.
  const [{ createElement }, { createRoot }, { EditorDemo }] = await Promise.all(
    [import('react'), import('react-dom/client'), import('./demo/EditorDemo')],
  );
  if (host.value) {
    root = createRoot(host.value);
    root.render(createElement(EditorDemo));
  }
});

onBeforeUnmount(() => {
  root?.unmount();
  root = null;
});
</script>

<template>
  <ClientOnly>
    <div ref="host" class="lexical-demo" />
  </ClientOnly>
</template>

<style>
.lexical-demo .demo-shell {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.lexical-demo .demo-toolbar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}
.lexical-demo .demo-toolbar button {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  cursor: pointer;
}
.lexical-demo .demo-toolbar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.lexical-demo .demo-sep {
  width: 1px;
  height: 1.2rem;
  background: var(--vp-c-divider);
  margin: 0 0.2rem;
}
.lexical-demo .demo-input-wrap {
  position: relative;
}
.lexical-demo .demo-input {
  min-height: 140px;
  padding: 0.85rem 1rem;
  outline: none;
}
.lexical-demo .demo-placeholder {
  position: absolute;
  top: 0.85rem;
  left: 1rem;
  color: var(--vp-c-text-3);
  pointer-events: none;
}
.lexical-demo .demo-bold {
  font-weight: 700;
}
.lexical-demo .demo-italic {
  font-style: italic;
}
.lexical-demo .demo-footer {
  margin: 0;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
}
</style>
