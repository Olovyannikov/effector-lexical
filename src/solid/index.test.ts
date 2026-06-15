import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';

import { createEditorModel } from '../core';
import { editorRef, mountEditor } from './index';

const onError = (error: Error) => {
  throw error;
};

describe('solid adapter', () => {
  it('editorRef binds the element on call and unbinds on cleanup', () => {
    const model = createEditorModel({ namespace: 'solid', onError });
    const element = document.createElement('div');
    element.contentEditable = 'true';

    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      const bind = editorRef(model);
      bind(element);
    });

    expect(model.editor.getRootElement()).toBe(element);

    dispose();
    expect(model.editor.getRootElement()).toBeNull();
  });

  it('mountEditor binds the element and returns a cleanup', () => {
    const model = createEditorModel({ namespace: 'solid', onError });
    const element = document.createElement('div');
    element.contentEditable = 'true';

    const cleanup = mountEditor(model, element);
    expect(model.editor.getRootElement()).toBe(element);

    cleanup();
    expect(model.editor.getRootElement()).toBeNull();
  });
});
