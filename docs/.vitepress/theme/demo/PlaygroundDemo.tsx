import { createStore, sample, attach } from 'effector';
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
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  type ElementFormatType,
  type ElementNode,
  type TextFormatType,
} from 'lexical';

import { createEditorModel } from '../../../../src';
import { EditorProvider } from '../../../../src/react';

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
  ]);
  const [active, canUndo, canRedo] = useUnit([$active, $canUndo, $canRedo]);

  const block = (label: string, value: string, onClick: () => void) => (
    <button
      className={active.block === value ? 'pg-btn pg-on' : 'pg-btn'}
      onClick={onClick}
    >
      {label}
    </button>
  );
  const fmt = (label: string, on: boolean, onClick: () => void) => (
    <button className={on ? 'pg-btn pg-on' : 'pg-btn'} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <div className="pg-toolbar">
      <button className="pg-btn" disabled={!canUndo} onClick={() => onUndo()}>
        ↶
      </button>
      <button className="pg-btn" disabled={!canRedo} onClick={() => onRedo()}>
        ↷
      </button>
      <span className="pg-sep" />
      {block('P', 'paragraph', () => onParagraph())}
      {block('H1', 'h1', () => onH1())}
      {block('H2', 'h2', () => onH2())}
      {block('❝', 'quote', () => onQuote())}
      {block('{ }', 'code', () => onCode())}
      <span className="pg-sep" />
      {fmt('B', active.bold, () => onBold())}
      {fmt('I', active.italic, () => onItalic())}
      {fmt('U', active.underline, () => onUnderline())}
      {fmt('<>', active.code, () => onInlineCode())}
      <span className="pg-sep" />
      <button className="pg-btn" onClick={() => onBullet()}>
        • List
      </button>
      <button className="pg-btn" onClick={() => onNumber()}>
        1. List
      </button>
      <button
        className="pg-btn"
        onClick={() => {
          const url = window.prompt('Link URL');
          onLink(url ? url : null);
        }}
      >
        🔗
      </button>
      <span className="pg-sep" />
      <button className="pg-btn" onClick={() => onAlignLeft()}>
        ⇤
      </button>
      <button className="pg-btn" onClick={() => onAlignCenter()}>
        ⇔
      </button>
      <button className="pg-btn" onClick={() => onAlignRight()}>
        ⇥
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
        </div>
        <Footer />
      </div>
    </EditorProvider>
  );
}
