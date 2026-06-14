import type {
  CreateEditorArgs,
  EditorState,
  EditorUpdateOptions,
  LexicalEditor,
  NodeKey,
  NodeMutation,
} from 'lexical';
import type { Event, EventCallable } from 'effector';

/** Configuration passed straight to Lexical's `createEditor`. */
export type CreateEditorModelConfig = CreateEditorArgs;

/** Payload emitted by `registerUpdateListener`. */
export interface UpdatePayload {
  editorState: EditorState;
  prevEditorState: EditorState;
  tags: Set<string>;
}

/** Payload emitted by `registerRootListener`. */
export interface RootPayload {
  rootElement: HTMLElement | null;
  prevRootElement: HTMLElement | null;
}

/** Payload emitted by `registerMutationListener`. */
export interface MutationPayload {
  mutatedNodes: Map<NodeKey, NodeMutation>;
  updateTags: Set<string>;
  dirtyLeaves: Set<NodeKey>;
  prevEditorState: EditorState;
}

/** Mutation callback inside `editor.update`. */
export type UpdateWriter = () => void;

/** Accepted input for the `updateFx` effect. */
export type UpdateParams =
  | UpdateWriter
  | { run: UpdateWriter; options?: EditorUpdateOptions };

/** A Lexical command bound to effector units. */
export interface CommandModel<Payload> {
  /** Dispatches the command on the editor when called. */
  dispatch: EventCallable<Payload>;
  /** Fires whenever the command is dispatched (observation only). */
  triggered: Event<Payload>;
}

export type { LexicalEditor, EditorState };
