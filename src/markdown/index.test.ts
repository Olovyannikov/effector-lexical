import { describe, it, expect } from 'vitest';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';

import { createEditorModel } from '../core';
import { createMarkdownApi } from './index';

const onError = (e: Error) => {
  throw e;
};

const model = () =>
  createEditorModel({
    namespace: 'md',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    onError,
  });

describe('createMarkdownApi', () => {
  it('imports Markdown into the editor', async () => {
    const editor = model();
    const { importMarkdownFx } = createMarkdownApi(editor);

    await importMarkdownFx('# Title\n\nsome **bold** text');

    expect(editor.$text.getState()).toContain('Title');
    expect(editor.$text.getState()).toContain('bold');
    editor.destroy();
  });

  it('exports the editor content as Markdown', async () => {
    const editor = model();
    const { exportMarkdownFx, importMarkdownFx } = createMarkdownApi(editor);

    await importMarkdownFx('# Title\n\nsome **bold** text');
    const md = await exportMarkdownFx();

    expect(md).toContain('# Title');
    expect(md).toContain('**bold**');
    editor.destroy();
  });

  it('round-trips content through Markdown', async () => {
    const source = model();
    const target = model();
    const a = createMarkdownApi(source);
    const b = createMarkdownApi(target);

    await a.importMarkdownFx('- one\n- two');
    await b.importMarkdownFx(await a.exportMarkdownFx());

    expect(target.$text.getState()).toContain('one');
    expect(target.$text.getState()).toContain('two');
    source.destroy();
    target.destroy();
  });
});
