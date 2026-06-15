<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';

const host = ref<HTMLElement | null>(null);
let root: { unmount: () => void } | null = null;

onMounted(async () => {
  const [{ createElement }, { createRoot }, { PlaygroundDemo }] =
    await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('./demo/PlaygroundDemo'),
    ]);
  if (host.value) {
    root = createRoot(host.value);
    root.render(createElement(PlaygroundDemo));
  }
});

onBeforeUnmount(() => {
  root?.unmount();
  root = null;
});
</script>

<template>
  <ClientOnly>
    <div ref="host" class="lexical-playground" />
  </ClientOnly>
</template>

<style>
.lexical-playground .pg-shell {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
}
.lexical-playground .pg-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}
.lexical-playground .pg-btn {
  min-width: 2rem;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1.2;
}
.lexical-playground .pg-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.lexical-playground .pg-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.lexical-playground .pg-on {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.lexical-playground .pg-sep {
  width: 1px;
  height: 1.4rem;
  background: var(--vp-c-divider);
  margin: 0 0.25rem;
}
.lexical-playground .pg-input-wrap {
  position: relative;
}
.lexical-playground .pg-md {
  display: block;
  width: 100%;
  box-sizing: border-box;
  min-height: 220px;
  padding: 1rem 1.1rem;
  border: 0;
  outline: none;
  resize: vertical;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  line-height: 1.6;
  tab-size: 2;
}
.lexical-playground .pg-input {
  min-height: 220px;
  padding: 1rem 1.1rem;
  outline: none;
}
/* Reset VitePress .vp-doc paragraph margins leaking into the editor. */
.lexical-playground .pg-input :where(p, h1, h2, blockquote, ul, ol) {
  margin: 0 0 0.35rem;
}
.lexical-playground .pg-input :where(p, h1, h2, blockquote, ul, ol):last-child {
  margin-bottom: 0;
}

/* Show formatting marks: ¶ at block ends. The class lives on the root element
   (the ContentEditable), toggled by the effector-driven FormattingMarksPlugin. */
.lexical-playground .pg-input.pg-marks p::after,
.lexical-playground .pg-input.pg-marks h1::after,
.lexical-playground .pg-input.pg-marks h2::after,
.lexical-playground .pg-input.pg-marks blockquote::after,
.lexical-playground .pg-input.pg-marks li::after {
  content: '¶';
  color: var(--vp-c-brand-1);
  opacity: 0.5;
  padding-left: 2px;
}
/* Empty blocks render a lone <br>; hide it so ¶ stays on the same line
   instead of dropping to the next one. */
.lexical-playground
  .pg-input.pg-marks
  :where(p, h1, h2, blockquote, li)
  > br:only-child {
  display: none;
}
/* WhitespaceNode → · over each space (real space kept for copy/paste). */
.lexical-playground .pg-input.pg-marks .ws-mark {
  position: relative;
  color: transparent;
}
.lexical-playground .pg-input.pg-marks .ws-mark::before {
  content: '·';
  position: absolute;
  inset: 0;
  text-align: center;
  color: var(--vp-c-brand-1);
  opacity: 0.55;
  pointer-events: none;
}
.lexical-playground .pg-placeholder {
  position: absolute;
  top: 1rem;
  left: 1.1rem;
  color: var(--vp-c-text-3);
  pointer-events: none;
}
.lexical-playground .pg-footer {
  margin: 0;
  padding: 0.5rem 1.1rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
}
.lexical-playground .pg-tree {
  border-top: 1px solid var(--vp-c-divider);
}
.lexical-playground .pg-tree-output {
  position: relative;
  margin: 0;
  padding: 0.75rem 1.1rem;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 280px;
}
.lexical-playground .pg-tree-btn {
  position: absolute;
  top: 6px;
  background: none;
  border: 0;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 10px;
}
.lexical-playground .pg-tree-btn:first-of-type {
  right: 84px;
}
.lexical-playground .pg-tree-tt {
  display: flex;
  gap: 0.4rem;
  padding: 0.4rem 1.1rem;
}
.lexical-playground .pg-tree-slider {
  flex: 1;
}

/* editor content theme */
.lexical-playground .pg-h1 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0.4rem 0;
}
.lexical-playground .pg-h2 {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0.4rem 0;
}
.lexical-playground .pg-quote {
  margin: 0.4rem 0;
  padding-left: 0.9rem;
  border-left: 3px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}
.lexical-playground .pg-ul {
  padding-left: 1.4rem;
  list-style: disc;
}
.lexical-playground .pg-ol {
  padding-left: 1.4rem;
  list-style: decimal;
}
.lexical-playground .pg-li {
  margin: 0.15rem 0;
}
.lexical-playground .pg-input hr {
  border: 0;
  border-top: 2px solid var(--vp-c-divider);
  margin: 0.8rem 0;
}
.lexical-playground .pg-input hr.selected {
  border-top-color: var(--vp-c-brand-1);
}
.lexical-playground .pg-link {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
.lexical-playground .pg-bold {
  font-weight: 700;
}
.lexical-playground .pg-italic {
  font-style: italic;
}
.lexical-playground .pg-underline {
  text-decoration: underline;
}
.lexical-playground .pg-code {
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}
.lexical-playground .pg-codeblock {
  display: block;
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-alt);
  padding: 0.8rem 1rem;
  border-radius: 6px;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  tab-size: 2;
}
</style>
