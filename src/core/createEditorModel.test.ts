import { describe, it, expect, vi } from 'vitest';
import { allSettled, fork } from 'effector';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  createCommand,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  TextNode,
} from 'lexical';

import { createEditorModel } from './createEditorModel';

const onError = (error: Error) => {
  throw error;
};

const writeText = (text: string) => () => {
  const root = $getRoot();
  root.clear();
  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode(text));
  root.append(paragraph);
};

describe('createEditorModel', () => {
  it('exposes the created editor instance', () => {
    const model = createEditorModel({ namespace: 'test', onError });
    expect(model.editor).toBe(model.$instance.getState());
    model.destroy();
  });

  it('updates $text and $state after updateFx', async () => {
    const model = createEditorModel({ namespace: 'test', onError });

    await model.updateFx(writeText('hello world'));

    expect(model.$text.getState()).toBe('hello world');
    expect(model.read(() => $getRoot().getTextContent())).toBe('hello world');
    model.destroy();
  });

  it('rejects updateFx when the writer throws', async () => {
    const model = createEditorModel({ namespace: 'test', onError });
    const boom = new Error('boom');

    await expect(
      model.updateFx(() => {
        throw boom;
      }),
    ).rejects.toBe(boom);
    model.destroy();
  });

  it('supports updateFx with explicit options object', async () => {
    const model = createEditorModel({ namespace: 'test', onError });
    const onUpdate = vi.fn();

    await model.updateFx({
      run: writeText('with options'),
      options: { onUpdate },
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(model.$text.getState()).toBe('with options');
    model.destroy();
  });

  it('emits the updated event with editor states', async () => {
    const model = createEditorModel({ namespace: 'test', onError });
    const listener = vi.fn();
    model.updated.watch(listener);

    await model.updateFx(writeText('abc'));

    // initial watch call + the update
    expect(listener).toHaveBeenCalled();
    const last = listener.mock.lastCall?.[0];
    expect(last.editorState).toBe(model.$state.getState());
    model.destroy();
  });

  it('reflects state as JSON in $json', async () => {
    const model = createEditorModel({ namespace: 'test', onError });
    await model.updateFx(writeText('json please'));

    const json = model.$json.getState();
    expect(json).toHaveProperty('root');
    expect(JSON.stringify(json)).toContain('json please');
    model.destroy();
  });

  it('tracks editable mode via $editable', () => {
    const model = createEditorModel({ namespace: 'test', onError });
    expect(model.$editable.getState()).toBe(true);

    model.editor.setEditable(false);
    expect(model.$editable.getState()).toBe(false);
    model.destroy();
  });

  it('round-trips state through setStateFx', async () => {
    const source = createEditorModel({ namespace: 'test', onError });
    await source.updateFx(writeText('persisted'));
    const snapshot = JSON.stringify(source.$json.getState());

    const target = createEditorModel({ namespace: 'test', onError });
    await target.setStateFx(snapshot);

    expect(target.$text.getState()).toBe('persisted');
    source.destroy();
    target.destroy();
  });

  it('accepts a raw EditorState instance in setStateFx', async () => {
    const source = createEditorModel({ namespace: 'test', onError });
    await source.updateFx(writeText('raw state'));
    const state = source.editor.getEditorState();

    const target = createEditorModel({ namespace: 'test', onError });
    await target.setStateFx(state);

    expect(target.$text.getState()).toBe('raw state');
    source.destroy();
    target.destroy();
  });

  it('accepts a serialized state object in setStateFx', async () => {
    const source = createEditorModel({ namespace: 'test', onError });
    await source.updateFx(writeText('serialized object'));
    const json = source.$json.getState();

    const target = createEditorModel({ namespace: 'test', onError });
    await target.setStateFx(json);

    expect(target.$text.getState()).toBe('serialized object');
    source.destroy();
    target.destroy();
  });

  it('runs focusFx and blurFx without throwing', async () => {
    const model = createEditorModel({ namespace: 'test', onError });
    model.editor.setRootElement(document.createElement('div'));

    await expect(model.focusFx()).resolves.toBeUndefined();
    await expect(model.blurFx()).resolves.toBeUndefined();
    model.destroy();
  });

  it('emits rootChanged when the root element changes', () => {
    const model = createEditorModel({ namespace: 'test', onError });
    const listener = vi.fn();
    model.rootChanged.watch(listener);
    listener.mockClear();

    const root = document.createElement('div');
    model.editor.setRootElement(root);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ rootElement: root }),
    );
    model.destroy();
  });

  describe('mutations', () => {
    it('emits node mutations as an effector event', async () => {
      const model = createEditorModel({ namespace: 'test', onError });
      model.editor.setRootElement(document.createElement('div'));
      const listener = vi.fn();
      model.mutations(TextNode, { skipInitialization: true }).watch(listener);

      await model.updateFx(writeText('mutate me'));

      expect(listener).toHaveBeenCalled();
      const payload = listener.mock.lastCall?.[0];
      expect([...payload.mutatedNodes.values()]).toContain('created');
      model.destroy();
    });
  });

  describe('commands', () => {
    it('dispatches and observes a command', async () => {
      const model = createEditorModel({ namespace: 'test', onError });
      const MY_COMMAND = createCommand<string>('MY_COMMAND');
      const { dispatch, triggered } = model.command(MY_COMMAND);

      const observed = vi.fn();
      triggered.watch(observed);

      dispatch('payload');
      // sample → effect → dispatchCommand is synchronous for direct calls
      await Promise.resolve();

      expect(observed).toHaveBeenCalledWith('payload');
      model.destroy();
    });
  });

  it('sets editable mode via setEditableFx', async () => {
    const model = createEditorModel({ namespace: 'test', onError });
    expect(model.$editable.getState()).toBe(true);

    await model.setEditableFx(false);

    expect(model.editor.isEditable()).toBe(false);
    expect(model.$editable.getState()).toBe(false);
    model.destroy();
  });

  describe('scope binding', () => {
    it('routes emissions into the attached scope', async () => {
      const model = createEditorModel({ namespace: 'test', onError });
      const scope = fork();
      model.attachToScope(scope);

      await model.updateFx(writeText('scoped'));

      expect(scope.getState(model.$text)).toBe('scoped');
      // global store stays at its initial value
      expect(model.$text.getState()).toBe('');
      model.destroy();
    });

    it('stays scope-safe when driven through allSettled', async () => {
      const model = createEditorModel({ namespace: 'test', onError });
      const scope = fork();
      model.attachToScope(scope);

      // Idiomatic: run the effect in the scope; listener emissions are routed
      // into the same scope by attachToScope.
      await allSettled(model.updateFx, {
        scope,
        params: writeText('via allSettled'),
      });

      expect(scope.getState(model.$text)).toBe('via allSettled');
      expect(model.$text.getState()).toBe('');
      model.destroy();
    });

    it('detachScope reverts to the global scope', async () => {
      const model = createEditorModel({ namespace: 'test', onError });
      const scope = fork();
      model.attachToScope(scope);
      model.detachScope();

      await model.updateFx(writeText('global again'));

      expect(model.$text.getState()).toBe('global again');
      expect(scope.getState(model.$text)).toBe('');
      model.destroy();
    });
  });

  describe('history', () => {
    it('mirrors CAN_UNDO/CAN_REDO commands into stores', () => {
      const model = createEditorModel({ namespace: 'test', onError });
      const { $canUndo, $canRedo } = model.history();

      expect($canUndo.getState()).toBe(false);
      model.editor.dispatchCommand(CAN_UNDO_COMMAND, true);
      model.editor.dispatchCommand(CAN_REDO_COMMAND, true);

      expect($canUndo.getState()).toBe(true);
      expect($canRedo.getState()).toBe(true);
      model.destroy();
    });

    it('exposes callable undo/redo events', () => {
      const model = createEditorModel({ namespace: 'test', onError });
      const { undo, redo } = model.history();
      expect(() => {
        undo();
        redo();
      }).not.toThrow();
      model.destroy();
    });
  });

  describe('destroy', () => {
    it('stops emitting events after teardown', async () => {
      const model = createEditorModel({ namespace: 'test', onError });
      const listener = vi.fn();
      model.textChanged.watch(listener);
      listener.mockClear();

      model.destroy();
      await model.updateFx(writeText('after destroy'));

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
