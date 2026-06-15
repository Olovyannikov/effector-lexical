<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';

const host = ref<HTMLElement | null>(null);
let root: { unmount: () => void } | null = null;

onMounted(async () => {
  const [{ createElement }, { createRoot }, { CollabDemo }] = await Promise.all(
    [import('react'), import('react-dom/client'), import('./demo/CollabDemo')],
  );
  if (host.value) {
    root = createRoot(host.value);
    root.render(createElement(CollabDemo));
  }
});

onBeforeUnmount(() => {
  root?.unmount();
  root = null;
});
</script>

<template>
  <ClientOnly>
    <div ref="host" class="lexical-collab" />
  </ClientOnly>
</template>

<style>
.lexical-collab .collab-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
@media (max-width: 640px) {
  .lexical-collab .collab-grid {
    grid-template-columns: 1fr;
  }
}
.lexical-collab .collab-pane {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.lexical-collab .collab-head {
  padding: 0.4rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}
.lexical-collab .collab-input-wrap {
  position: relative;
}
.lexical-collab .collab-input {
  min-height: 140px;
  padding: 0.85rem 1rem;
  outline: none;
}
.lexical-collab .collab-input p {
  margin: 0 0 0.35rem;
}
.lexical-collab .collab-ph {
  position: absolute;
  top: 0.85rem;
  left: 1rem;
  color: var(--vp-c-text-3);
  pointer-events: none;
}
</style>
