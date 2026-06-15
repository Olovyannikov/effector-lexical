import {
  createEditor,
  COMMAND_PRIORITY_EDITOR,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getRoot,
  $getSelection,
  $isRangeSelection,
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
  scopeBind,
  type Effect,
  type Event,
  type EventCallable,
  type Scope,
  type Store,
} from 'effector';

import type {
  CommandModel,
  CreateEditorModelConfig,
  HistoryModel,
  MutationPayload,
  RootPayload,
  SelectionSnapshot,
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
  /** A snapshot of the current selection (`null` when not a range selection). */
  readonly $selection: Store<SelectionSnapshot | null>;

  // ── Outgoing effects (effector → Lexical) ─────────────────────────────
  /** Runs `editor.update`; resolves after reconciliation. */
  readonly updateFx: Effect<UpdateParams, void>;
  /** Replaces the editor state (accepts EditorState, JSON string or serialized). */
  readonly setStateFx: Effect<
    EditorState | SerializedEditorState | string,
    void
  >;
  /** Sets the editor's editable mode. */
  readonly setEditableFx: Effect<boolean, void>;
  readonly focusFx: Effect<void, void>;
  readonly blurFx: Effect<void, void>;

  // ── Helpers ───────────────────────────────────────────────────────────
  /** Reads from the current editor state synchronously. */
  read<T>(reader: () => T): T;
  /**
   * Binds every listener-driven emission of this model to a forked `scope`,
   * so `$state`/`$text`/`$editable`/`$json` and `command`/`mutations` events
   * update that scope instead of the global one. Call once after `fork()`.
   */
  attachToScope(scope: Scope): void;
  /** Reverts {@link attachToScope}; emissions go back to the global scope. */
  detachScope(): void;
  /** History units (`$canUndo`/`$canRedo`/`undo`/`redo`); needs an active history plugin. */
  history(): HistoryModel;
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
  /**
   * Registers a node transform (runs inside updates to normalize nodes) and
   * tracks it for `destroy()`. Returns the unregister function.
   */
  nodeTransform<T extends LexicalNode>(
    node: Klass<T>,
    transform: (node: T) => void,
  ): () => void;
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

  // Lexical listeners fire outside any effector scope. `fire` routes an
  // emission into the attached scope (if any) via `scopeBind`, so scoped
  // consumers stay in sync. Defaults to the global scope.
  let boundScope: Scope | null = null;
  const fire = <P>(event: EventCallable<P>, payload: P): void => {
    if (boundScope) scopeBind(event, { scope: boundScope })(payload);
    else event(payload);
  };

  // ── Events fed by Lexical listeners ───────────────────────────────────
  const updated = createEvent<UpdatePayload>();
  const textChanged = createEvent<string>();
  const editableChanged = createEvent<boolean>();
  const rootChanged = createEvent<RootPayload>();

  teardown.push(
    editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
      fire(updated, { editorState, prevEditorState, tags });
    }),
    editor.registerTextContentListener((text) => {
      fire(textChanged, text);
    }),
    editor.registerEditableListener((editable) => {
      fire(editableChanged, editable);
    }),
    editor.registerRootListener((rootElement, prevRootElement) => {
      fire(rootChanged, { rootElement, prevRootElement });
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

  const $selection = createStore<SelectionSnapshot | null>(null);
  sample({
    clock: updated,
    fn: ({ editorState }): SelectionSnapshot | null =>
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return null;
        return {
          isCollapsed: selection.isCollapsed(),
          isBackward: selection.isBackward(),
          text: selection.getTextContent(),
        };
      }),
    target: $selection,
  });

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

  const setEditableFx = createEffect<boolean, void>((editable) => {
    editor.setEditable(editable);
  });

  const focusFx = createEffect<void, void>(() => editor.focus());
  const blurFx = createEffect<void, void>(() => editor.blur());

  // ── Helpers ───────────────────────────────────────────────────────────
  const read = <T>(reader: () => T): T => editor.getEditorState().read(reader);

  const attachToScope = (scope: Scope): void => {
    boundScope = scope;
  };
  const detachScope = (): void => {
    boundScope = null;
  };

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
          fire(triggered, payload);
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
          fire(event, {
            mutatedNodes,
            updateTags,
            dirtyLeaves,
            prevEditorState,
          });
        },
        options,
      ),
    );
    return event;
  };

  const nodeTransform = <T extends LexicalNode>(
    node: Klass<T>,
    transform: (node: T) => void,
  ): (() => void) => {
    const unregister = editor.registerNodeTransform(node, transform);
    teardown.push(unregister);
    return unregister;
  };

  const history = (): HistoryModel => {
    const canUndoChanged = createEvent<boolean>();
    const canRedoChanged = createEvent<boolean>();
    const $canUndo = createStore(false).on(canUndoChanged, (_, v) => v);
    const $canRedo = createStore(false).on(canRedoChanged, (_, v) => v);

    teardown.push(
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          fire(canUndoChanged, payload);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          fire(canRedoChanged, payload);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );

    return {
      $canUndo,
      $canRedo,
      undo: command<void>(UNDO_COMMAND).dispatch,
      redo: command<void>(REDO_COMMAND).dispatch,
    };
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
    $selection,
    updateFx,
    setStateFx,
    setEditableFx,
    focusFx,
    blurFx,
    read,
    attachToScope,
    detachScope,
    command,
    mutations,
    nodeTransform,
    history,
    destroy,
  };
}
