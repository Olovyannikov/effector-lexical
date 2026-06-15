import { useEffect } from 'react';
import { createStore, createEvent, sample, attach } from 'effector';
import { useUnit } from 'effector-react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from '@lexical/rich-text';
import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from '@lexical/list';
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  CodeNode,
  CodeHighlightNode,
  $createCodeNode,
  registerCodeHighlighting,
} from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import {
  createEditor,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type ElementFormatType,
  type ElementNode,
  type SerializedLexicalNode,
  type TextFormatType,
} from 'lexical';
import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
  $insertGeneratedNodes,
} from '@lexical/clipboard';

import { createEditorModel } from '../../../../src';
import { EditorProvider, useEditorInstance } from '../../../../src/react';
import { createMarkdownApi } from '../../../../src/markdown';
import {
  SHOW_INVISIBLES_NODES,
  registerShowInvisibles,
  refreshInvisibles,
} from './showInvisibles';

const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  CodeNode,
  CodeHighlightNode,
  ...SHOW_INVISIBLES_NODES,
];

const editor = createEditorModel({
  namespace: 'playground',
  nodes: NODES,
  theme: {
    heading: { h1: 'pg-h1', h2: 'pg-h2' },
    quote: 'pg-quote',
    list: { ul: 'pg-ul', ol: 'pg-ol', listitem: 'pg-li' },
    link: 'pg-link',
    code: 'pg-codeblock',
    text: {
      bold: 'pg-bold',
      italic: 'pg-italic',
      underline: 'pg-underline',
      code: 'pg-code',
    },
  },
  onError: (error) => {
    throw error;
  },
});

// Syntax highlighting for code blocks (registers node transforms once).
registerCodeHighlighting(editor.editor);

// ── Inline formats (commands → events) ──────────────────────────────────
const format = editor.command<TextFormatType>(FORMAT_TEXT_COMMAND);
const bold = format.dispatch.prepend(() => 'bold' as const);
const italic = format.dispatch.prepend(() => 'italic' as const);
const underline = format.dispatch.prepend(() => 'underline' as const);
const inlineCode = format.dispatch.prepend(() => 'code' as const);

// ── Block type (updateFx via attach) ────────────────────────────────────
const setBlockFx = attach({
  effect: editor.updateFx,
  mapParams: (create: () => ElementNode) => () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) $setBlocksType(selection, create);
  },
});
const toParagraph = setBlockFx.prepend(() => () => $createParagraphNode());
const toH1 = setBlockFx.prepend(() => () => $createHeadingNode('h1'));
const toH2 = setBlockFx.prepend(() => () => $createHeadingNode('h2'));
const toQuote = setBlockFx.prepend(() => () => $createQuoteNode());
const toCode = setBlockFx.prepend(() => () => $createCodeNode());

// ── Lists & links (commands) ────────────────────────────────────────────
const bulletList = editor.command<void>(INSERT_UNORDERED_LIST_COMMAND).dispatch;
const numberList = editor.command<void>(INSERT_ORDERED_LIST_COMMAND).dispatch;
const toggleLink = editor.command<string | null>(TOGGLE_LINK_COMMAND).dispatch;

// ── Alignment ───────────────────────────────────────────────────────────
const align = editor.command<ElementFormatType>(FORMAT_ELEMENT_COMMAND);
const alignLeft = align.dispatch.prepend(() => 'left' as const);
const alignCenter = align.dispatch.prepend(() => 'center' as const);
const alignRight = align.dispatch.prepend(() => 'right' as const);

// ── History ─────────────────────────────────────────────────────────────
const { $canUndo, $canRedo, undo, redo } = editor.history();

// ── Selection-aware active state (pure, from updated payload) ────────────
interface Active {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  code: boolean;
  block: string;
}
const EMPTY: Active = {
  bold: false,
  italic: false,
  underline: false,
  code: false,
  block: 'paragraph',
};

const $active = createStore<Active>(EMPTY);

sample({
  clock: editor.updated,
  fn: ({ editorState }): Active =>
    editorState.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return EMPTY;
      const anchor = selection.anchor.getNode();
      const top =
        anchor.getKey() === 'root'
          ? anchor
          : anchor.getTopLevelElementOrThrow();
      const block = $isHeadingNode(top) ? top.getTag() : top.getType();
      return {
        bold: selection.hasFormat('bold'),
        italic: selection.hasFormat('italic'),
        underline: selection.hasFormat('underline'),
        code: selection.hasFormat('code'),
        block,
      };
    }),
  target: $active,
});

const $chars = editor.$text.map((t) => t.length);
const $words = editor.$text.map((t) =>
  t.trim() ? t.trim().split(/\s+/).length : 0,
);

// ── "Show formatting marks" toggle (pure effector state) ────────────────
const toggleMarks = createEvent();
const $marks = createStore(false).on(toggleMarks, (on) => !on);

// Convert whitespace / line breaks into marker nodes while marks are on.
registerShowInvisibles(editor.editor, () => $marks.getState());

// ── Paste Markdown → convert to nodes at the caret ──────────────────────
// Heuristic: only convert when the pasted text actually looks like Markdown,
// so plain-text paste stays plain.
const MARKDOWN_HINT =
  /(^|\n)\s{0,3}(#{1,6} |[-*+] |\d+\. |> |```)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`/;

const markdownToNodesJSON = (md: string): SerializedLexicalNode[] => {
  // Build in a throwaway editor (convert replaces a whole root), then hand the
  // serialized nodes to the real editor to insert at the selection.
  const temp = createEditor({
    nodes: NODES,
    onError: (e) => {
      throw e;
    },
  });
  let nodes: SerializedLexicalNode[] = [];
  temp.update(
    () => {
      $convertFromMarkdownString(md, TRANSFORMERS);
      const root = $getRoot();
      nodes = $generateJSONFromSelectedNodes(
        temp,
        root.select(0, root.getChildrenSize()),
      ).nodes;
    },
    { discrete: true },
  );
  return nodes;
};

editor.editor.registerCommand(
  PASTE_COMMAND,
  (event) => {
    if (!(event instanceof ClipboardEvent)) return false;
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!text || !MARKDOWN_HINT.test(text)) return false; // let plain paste run
    event.preventDefault();
    const serialized = markdownToNodesJSON(text);
    editor.editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $insertGeneratedNodes(
        editor.editor,
        $generateNodesFromSerializedNodes(serialized),
        selection,
      );
    });
    return true;
  },
  COMMAND_PRIORITY_HIGH,
);

// ── Markdown source mode ────────────────────────────────────────────────
const { exportMarkdownFx, importMarkdownFx } = createMarkdownApi(editor);
const toggleMarkdown = createEvent();
const editMarkdown = createEvent<string>();
const $markdownMode = createStore(false).on(toggleMarkdown, (on) => !on);
const $md = createStore('')
  .on(editMarkdown, (_, value) => value)
  .on(exportMarkdownFx.doneData, (_, value) => value);

// Entering source mode → dump current content to Markdown.
sample({
  clock: toggleMarkdown,
  source: $markdownMode,
  filter: (on) => on,
  target: exportMarkdownFx,
});
// Leaving source mode → apply the edited Markdown back to the editor.
sample({
  clock: toggleMarkdown,
  source: { on: $markdownMode, md: $md },
  filter: ({ on }) => !on,
  fn: ({ md }) => md,
  target: importMarkdownFx,
});

// Platform-aware shortcut hints for tooltips.
const IS_APPLE =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
const sc = (key: string) => (IS_APPLE ? `⌘${key}` : `Ctrl+${key}`);
const REDO_HINT = IS_APPLE ? '⇧⌘Z' : 'Ctrl+Shift+Z';

function Toolbar() {
  const [
    onBold,
    onItalic,
    onUnderline,
    onInlineCode,
    onParagraph,
    onH1,
    onH2,
    onQuote,
    onCode,
    onBullet,
    onNumber,
    onLink,
    onAlignLeft,
    onAlignCenter,
    onAlignRight,
    onUndo,
    onRedo,
    onToggleMarks,
    onToggleMarkdown,
  ] = useUnit([
    bold,
    italic,
    underline,
    inlineCode,
    toParagraph,
    toH1,
    toH2,
    toQuote,
    toCode,
    bulletList,
    numberList,
    toggleLink,
    alignLeft,
    alignCenter,
    alignRight,
    undo,
    redo,
    toggleMarks,
    toggleMarkdown,
  ]);
  const [active, canUndo, canRedo, marks, mdMode] = useUnit([
    $active,
    $canUndo,
    $canRedo,
    $marks,
    $markdownMode,
  ]);

  const block = (
    label: string,
    value: string,
    title: string,
    onClick: () => void,
  ) => (
    <button
      className={active.block === value ? 'pg-btn pg-on' : 'pg-btn'}
      title={title}
      disabled={mdMode}
      onClick={onClick}
    >
      {label}
    </button>
  );
  const fmt = (
    label: string,
    on: boolean,
    title: string,
    onClick: () => void,
  ) => (
    <button
      className={on ? 'pg-btn pg-on' : 'pg-btn'}
      title={title}
      disabled={mdMode}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="pg-toolbar">
      <button
        className="pg-btn"
        title={`Undo (${sc('Z')})`}
        disabled={!canUndo || mdMode}
        onClick={() => onUndo()}
      >
        ↶
      </button>
      <button
        className="pg-btn"
        title={`Redo (${REDO_HINT})`}
        disabled={!canRedo || mdMode}
        onClick={() => onRedo()}
      >
        ↷
      </button>
      <span className="pg-sep" />
      {block('P', 'paragraph', 'Paragraph', () => onParagraph())}
      {block('H1', 'h1', 'Heading 1', () => onH1())}
      {block('H2', 'h2', 'Heading 2', () => onH2())}
      {block('❝', 'quote', 'Quote', () => onQuote())}
      {block('{ }', 'code', 'Code block', () => onCode())}
      <span className="pg-sep" />
      {fmt('B', active.bold, `Bold (${sc('B')})`, () => onBold())}
      {fmt('I', active.italic, `Italic (${sc('I')})`, () => onItalic())}
      {fmt('U', active.underline, `Underline (${sc('U')})`, () =>
        onUnderline(),
      )}
      {fmt('<>', active.code, 'Inline code', () => onInlineCode())}
      <span className="pg-sep" />
      <button
        className="pg-btn"
        title="Bullet list"
        disabled={mdMode}
        onClick={() => onBullet()}
      >
        • List
      </button>
      <button
        className="pg-btn"
        title="Numbered list"
        disabled={mdMode}
        onClick={() => onNumber()}
      >
        1. List
      </button>
      <button
        className="pg-btn"
        title="Insert link"
        disabled={mdMode}
        onClick={() => {
          const url = window.prompt('Link URL');
          onLink(url ? url : null);
        }}
      >
        🔗
      </button>
      <span className="pg-sep" />
      <button
        className="pg-btn"
        title="Align left"
        disabled={mdMode}
        onClick={() => onAlignLeft()}
      >
        ⇤
      </button>
      <button
        className="pg-btn"
        title="Align center"
        disabled={mdMode}
        onClick={() => onAlignCenter()}
      >
        ⇔
      </button>
      <button
        className="pg-btn"
        title="Align right"
        disabled={mdMode}
        onClick={() => onAlignRight()}
      >
        ⇥
      </button>
      <span className="pg-sep" />
      <button
        className={marks ? 'pg-btn pg-on' : 'pg-btn'}
        title="Show formatting marks"
        disabled={mdMode}
        onClick={() => onToggleMarks()}
      >
        ¶
      </button>
      <button
        className={mdMode ? 'pg-btn pg-on' : 'pg-btn'}
        title="Markdown source"
        onClick={() => onToggleMarkdown()}
      >
        MD
      </button>
    </div>
  );
}

function Footer() {
  const [chars, words, active] = useUnit([$chars, $words, $active]);
  return (
    <p className="pg-footer">
      block: <b>{active.block}</b> · {words} words · {chars} chars · all derived
      from effector stores
    </p>
  );
}

/**
 * Reusable plugin: reflects the `$marks` store onto the editor's root element as
 * a class, so CSS can reveal paragraph/line marks. Re-applies when the root
 * element changes (e.g. remount).
 */
function FormattingMarksPlugin() {
  const on = useUnit($marks);
  const editor = useEditorInstance();
  useEffect(() => {
    const apply = (root: HTMLElement | null) =>
      root?.classList.toggle('pg-marks', on);
    apply(editor.getRootElement());
    return editor.registerRootListener(apply);
  }, [editor, on]);
  // Re-process existing content (convert/revert markers) on toggle.
  useEffect(() => refreshInvisibles(editor), [editor, on]);
  return null;
}

export function PlaygroundDemo() {
  const [mdMode, md] = useUnit([$markdownMode, $md]);
  const onEditMarkdown = useUnit(editMarkdown);
  return (
    <EditorProvider model={editor}>
      <div className="pg-shell">
        <Toolbar />
        {mdMode ? (
          <textarea
            className="pg-md"
            value={md}
            spellCheck={false}
            onChange={(e) => onEditMarkdown(e.currentTarget.value)}
          />
        ) : (
          <div className="pg-input-wrap">
            <RichTextPlugin
              contentEditable={<ContentEditable className="pg-input" />}
              placeholder={
                <div className="pg-placeholder">
                  Headings, lists, links, formatting — all wired through
                  effector…
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <FormattingMarksPlugin />
          </div>
        )}
        <Footer />
      </div>
    </EditorProvider>
  );
}
