import { useEffect } from 'react';
import { createStore, createEvent, sample, attach } from 'effector';
import { useUnit } from 'effector-react';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
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
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  TextNode,
  type ElementFormatType,
  type ElementNode,
  type TextFormatType,
} from 'lexical';

import { createEditorModel } from '../../../../src';
import { EditorProvider, useEditorInstance } from '../../../../src/react';

const editor = createEditorModel({
  namespace: 'playground',
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    CodeNode,
    CodeHighlightNode,
  ],
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

// Experimental: split whitespace runs into token-mode nodes (each rendered as
// its own <span style="--ws:1">) so CSS can draw a · per space. Reverts on off.
const WS = /\s/;
editor.editor.registerNodeTransform(TextNode, (node) => {
  const marked = node.getMode() === 'token' && node.getStyle().includes('--ws');
  if (marked) {
    if (!$marks.getState()) node.setMode('normal').setStyle('');
    return;
  }
  if (!$marks.getState() || node.getMode() === 'token') return;

  const text = node.getTextContent();
  const start = text.search(WS);
  if (start === -1) return;

  // Isolate a single whitespace char as its own node (one · per space).
  const fromStart = start > 0 ? node.splitText(start)[1]! : node;
  const run =
    fromStart.getTextContent().length > 1
      ? fromStart.splitText(1)[0]!
      : fromStart;
  run.setMode('token').setStyle('--ws:1');
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
  ]);
  const [active, canUndo, canRedo, marks] = useUnit([
    $active,
    $canUndo,
    $canRedo,
    $marks,
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
        disabled={!canUndo}
        onClick={() => onUndo()}
      >
        ↶
      </button>
      <button
        className="pg-btn"
        title={`Redo (${REDO_HINT})`}
        disabled={!canRedo}
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
      <button className="pg-btn" title="Bullet list" onClick={() => onBullet()}>
        • List
      </button>
      <button
        className="pg-btn"
        title="Numbered list"
        onClick={() => onNumber()}
      >
        1. List
      </button>
      <button
        className="pg-btn"
        title="Insert link"
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
        onClick={() => onAlignLeft()}
      >
        ⇤
      </button>
      <button
        className="pg-btn"
        title="Align center"
        onClick={() => onAlignCenter()}
      >
        ⇔
      </button>
      <button
        className="pg-btn"
        title="Align right"
        onClick={() => onAlignRight()}
      >
        ⇥
      </button>
      <span className="pg-sep" />
      <button
        className={marks ? 'pg-btn pg-on' : 'pg-btn'}
        title="Show formatting marks"
        onClick={() => onToggleMarks()}
      >
        ¶
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
  // Re-run the whitespace transform over existing content on toggle.
  useEffect(() => {
    editor.update(() => {
      $getRoot()
        .getAllTextNodes()
        .forEach((n) => n.markDirty());
    });
  }, [editor, on]);
  return null;
}

export function PlaygroundDemo() {
  return (
    <EditorProvider model={editor}>
      <div className="pg-shell">
        <Toolbar />
        <div className="pg-input-wrap">
          <RichTextPlugin
            contentEditable={<ContentEditable className="pg-input" />}
            placeholder={
              <div className="pg-placeholder">
                Headings, lists, links, formatting — all wired through effector…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <FormattingMarksPlugin />
        </div>
        <Footer />
      </div>
    </EditorProvider>
  );
}
