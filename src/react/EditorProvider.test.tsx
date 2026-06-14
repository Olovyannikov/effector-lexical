import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

import { createEditorModel } from '../core';
import { EditorProvider } from './EditorProvider';
import { useEditorModel, useEditorInstance } from './context';

const onError = (error: Error) => {
  throw error;
};

function Editor() {
  return (
    <PlainTextPlugin
      contentEditable={<ContentEditable data-testid="content" />}
      ErrorBoundary={LexicalErrorBoundary}
    />
  );
}

describe('EditorProvider', () => {
  it('injects the model editor into LexicalComposerContext', () => {
    const model = createEditorModel({ namespace: 'react', onError });
    let contextEditor: unknown;

    function Probe() {
      const [editor] = useLexicalComposerContext();
      contextEditor = editor;
      return null;
    }

    render(
      <EditorProvider model={model}>
        <Probe />
      </EditorProvider>,
    );

    expect(contextEditor).toBe(model.editor);
    model.destroy();
  });

  it('exposes the model through useEditorModel / useEditorInstance', () => {
    const model = createEditorModel({ namespace: 'react', onError });
    let fromHook: unknown;
    let instance: unknown;

    function Probe() {
      fromHook = useEditorModel();
      instance = useEditorInstance();
      return null;
    }

    render(
      <EditorProvider model={model}>
        <Probe />
      </EditorProvider>,
    );

    expect(fromHook).toBe(model);
    expect(instance).toBe(model.editor);
    model.destroy();
  });

  it('renders editor content and reflects programmatic updates in the DOM', async () => {
    const model = createEditorModel({ namespace: 'react', onError });

    const { getByTestId } = render(
      <EditorProvider model={model}>
        <Editor />
      </EditorProvider>,
    );

    await act(async () => {
      await model.updateFx(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode('typed in react'));
        root.append(paragraph);
      });
    });

    await waitFor(() => {
      expect(getByTestId('content').textContent).toBe('typed in react');
    });
    expect(model.$text.getState()).toBe('typed in react');
    model.destroy();
  });

  it('throws when useEditorModel is used outside a provider', () => {
    function Orphan() {
      useEditorModel();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/EditorProvider/);
  });
});
