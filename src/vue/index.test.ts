import { describe, it, expect } from 'vitest';
import { createApp, h, defineComponent } from 'vue';

import { createEditorModel } from '../core';
import { useEditorRoot } from './index';

const onError = (error: Error) => {
  throw error;
};

describe('vue adapter', () => {
  it('useEditorRoot binds the element on mount and unbinds on unmount', () => {
    const model = createEditorModel({ namespace: 'vue', onError });

    const Comp = defineComponent({
      setup() {
        const root = useEditorRoot(model);
        return () => h('div', { contenteditable: 'true', ref: root });
      },
    });

    const host = document.createElement('div');
    const app = createApp(Comp);
    app.mount(host);

    expect(model.editor.getRootElement()).toBe(host.firstElementChild);

    app.unmount();
    expect(model.editor.getRootElement()).toBeNull();
  });
});
