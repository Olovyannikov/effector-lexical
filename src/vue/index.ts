import { onMounted, onBeforeUnmount, ref, type Ref } from 'vue';

import type { EditorModel } from '../core';

/**
 * A Vue composable that returns a template ref binding the model's Lexical
 * editor to a contenteditable element (and unbinding it on unmount).
 *
 * ```vue
 * <script setup>
 * import { useEditorRoot } from 'effector-lexical/vue';
 * const root = useEditorRoot(editor);
 * </script>
 * <template>
 *   <div contenteditable :ref="root" />
 * </template>
 * ```
 *
 * The core is framework-agnostic, so reactivity comes from `effector-vue` and
 * rich-text behaviour from Lexical's own `registerRichText` / `registerHistory`.
 */
export function useEditorRoot(model: EditorModel): Ref<HTMLElement | null> {
  const element = ref<HTMLElement | null>(null);

  onMounted(() => {
    if (element.value) model.editor.setRootElement(element.value);
  });
  onBeforeUnmount(() => model.editor.setRootElement(null));

  return element;
}
