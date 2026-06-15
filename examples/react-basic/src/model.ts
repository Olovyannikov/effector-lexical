import { createEvent, createStore } from 'effector';
import { createEditorModel } from 'effector-lexical';
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  type TextFormatType,
} from 'lexical';

const theme = {
  text: {
    bold: 'editor-bold',
    italic: 'editor-italic',
  },
};

export const editor = createEditorModel({
  namespace: 'react-basic',
  theme,
  onError: (error) => {
    throw error;
  },
});

// Bind Lexical commands to effector events.
const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
export const formatBold = format.dispatch.prepend(() => 'bold' as const);
export const formatItalic = format.dispatch.prepend(() => 'italic' as const);

export const undo = editor.command<void>(UNDO_COMMAND).dispatch;
export const redo = editor.command<void>(REDO_COMMAND).dispatch;

// $text and $json are plain effector stores — use them anywhere.
export const $charCount = editor.$text.map((text) => text.length);

// Devtools: toggle the editor-state TreeView (Lexical's built-in inspector).
export const toggleDebug = createEvent();
export const $debug = createStore(false).on(toggleDebug, (on) => !on);
