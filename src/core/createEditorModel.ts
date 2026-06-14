import {
  createEditor,
  COMMAND_PRIORITY_EDITOR,
  $getRoot,
  type CommandListenerPriority,
  type EditorState,
  type Klass,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
  type SerializedEditorState,
} from 'lexical';
import {
  createEffect,
  createEvent,
  createStore,
  sample,
  type Effect,
  type Event,
  type Store,
} from 'effector';

import type {
  CommandModel,
  CreateEditorModelConfig,
  MutationPayload,
  RootPayload,
  UpdateParams,
  UpdatePayload,
} from './types';

/** Options for `registerMutationListener` (not re-exported from `lexical`). */
export interface MutationListenerOptions {
  skipInitialization?: boolean;
}

export interface EditorModel {
  /** The underlying Lexical editor instance, owned by this model. */
  readonly editor: LexicalEditor;
  /** The editor instance as a store (handy for combining with other units). */
  readonly $instance: Store<LexicalEditor>;

  // ── Listener-driven events ────────────────────────────────────────────
  /** Fires after Lexical commits an update (reconciliation done). */
  readonly updated: Event<UpdatePayload>;
  /** Fires when the editor's text content changes. */
  readonly textChanged: Event<string>;
  /** Fires when the editor's editable mode changes. */
  readonly editableChanged: Event<boolean>;
  /** Fires when the editor's root DOM element changes. */
  readonly rootChanged: Event<RootPayload>;

  // ── Derived state ─────────────────────────────────────────────────────
  readonly $state: Store<EditorState>;
  readonly $text: Store<string>;
  readonly $editable: Store<boolean>;
  readonly $json: Store<SerializedEditorState>;

  // ── Outgoing effects (effector → Lexical) ─────────────────────────────
  /** Runs `editor.update`; resolves after reconciliation. */
  readonly updateFx: Effect<UpdateParams, void>;
  /** Replaces the editor state (accepts EditorState, JSON string or serialized). */
  readonly setStateFx: Effect<
    EditorState | SerializedEditorState | string,
    void
  >;
  readonly focusFx: Effect<void, void>;
  readonly blurFx: Effect<void, void>;

  // ── Helpers ───────────────────────────────────────────────────────────
  /** Reads from the current editor state synchronously. */
  read<T>(reader: () => T): T;
  /** Binds a Lexical command to effector units. */
  command<Payload>(
    command: LexicalCommand<Payload>,
    priority?: CommandListenerPriority,
  ): CommandModel<Payload>;
  /** Observes mutations of a given node type as an effector event. */
  mutations<T extends LexicalNode>(
    node: Klass<T>,
    options?: MutationListenerOptions,
  ): Event<MutationPayload>;
  /** Unregisters every Lexical listener created by this model. */
  destroy(): void;
}

const readInitialText = (editor: LexicalEditor): string =>
  editor.getEditorState().read(() => $getRoot().getTextContent());

export function createEditorModel(
  config?: CreateEditorModelConfig,
): EditorModel {
  const editor = createEditor(config);
  const teardown: Array<() => void> = [];

  // ── Events fed by Lexical listeners ───────────────────────────────────
  const updated = createEvent<UpdatePayload>();
  const textChanged = createEvent<string>();
  const editableChanged = createEvent<boolean>();
  const rootChanged = createEvent<RootPayload>();

  teardown.push(
    editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
      updated({ editorState, prevEditorState, tags });
    }),
    editor.registerTextContentListener((text) => {
      textChanged(text);
    }),
    editor.registerEditableListener((editable) => {
      editableChanged(editable);
    }),
    editor.registerRootListener((rootElement, prevRootElement) => {
      rootChanged({ rootElement, prevRootElement });
    }),
  );

  // ── Derived state ─────────────────────────────────────────────────────
  const $instance = createStore(editor);

  const $state = createStore<EditorState>(editor.getEditorState()).on(
    updated,
    (_, { editorState }) => editorState,
  );

  const $text = createStore<string>(readInitialText(editor)).on(
    textChanged,
    (_, text) => text,
  );

  const $editable = createStore<boolean>(editor.isEditable()).on(
    editableChanged,
    (_, editable) => editable,
  );

  const $json = $state.map((state) => state.toJSON());

  // ── Outgoing effects ──────────────────────────────────────────────────
  const updateFx = createEffect<UpdateParams, void>(
    (params) =>
      new Promise<void>((resolve, reject) => {
        const { run, options } =
          typeof params === 'function'
            ? { run: params, options: undefined }
            : params;
        try {
          editor.update(run, {
            ...options,
            onUpdate: () => {
              options?.onUpdate?.();
              resolve();
            },
          });
        } catch (error) {
          reject(error);
        }
      }),
  );

  const setStateFx = createEffect<
    EditorState | SerializedEditorState | string,
    void
  >((state) => {
    const next =
      typeof state !== 'string' &&
      typeof (state as EditorState).read === 'function'
        ? (state as EditorState)
        : editor.parseEditorState(state as string | SerializedEditorState);
    editor.setEditorState(next);
  });

  const focusFx = createEffect<void, void>(() => editor.focus());
  const blurFx = createEffect<void, void>(() => editor.blur());

  // ── Helpers ───────────────────────────────────────────────────────────
  const read = <T>(reader: () => T): T => editor.getEditorState().read(reader);

  const command = <Payload>(
    cmd: LexicalCommand<Payload>,
    priority: CommandListenerPriority = COMMAND_PRIORITY_EDITOR,
  ): CommandModel<Payload> => {
    const dispatch = createEvent<Payload>();
    const triggered = createEvent<Payload>();

    teardown.push(
      editor.registerCommand(
        cmd,
        (payload) => {
          triggered(payload);
          return false;
        },
        priority,
      ),
    );

    const dispatchFx = createEffect<Payload, void>((payload) => {
      editor.dispatchCommand(cmd, payload);
    });
    sample({ clock: dispatch, target: dispatchFx });

    return { dispatch, triggered };
  };

  const mutations = <T extends LexicalNode>(
    node: Klass<T>,
    options?: MutationListenerOptions,
  ): Event<MutationPayload> => {
    const event = createEvent<MutationPayload>();
    teardown.push(
      editor.registerMutationListener(
        node,
        (mutatedNodes, { updateTags, dirtyLeaves, prevEditorState }) => {
          event({ mutatedNodes, updateTags, dirtyLeaves, prevEditorState });
        },
        options,
      ),
    );
    return event;
  };

  const destroy = (): void => {
    teardown.forEach((unsubscribe) => unsubscribe());
    teardown.length = 0;
  };

  return {
    editor,
    $instance,
    updated,
    textChanged,
    editableChanged,
    rootChanged,
    $state,
    $text,
    $editable,
    $json,
    updateFx,
    setStateFx,
    focusFx,
    blurFx,
    read,
    command,
    mutations,
    destroy,
  };
}
