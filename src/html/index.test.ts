import { describe, it, expect } from 'vitest';

import { createEditorModel } from '../core';
import { createHtmlApi } from './index';

const onError = (e: Error) => {
  throw e;
};

describe('createHtmlApi', () => {
  it('imports HTML into the editor', async () => {
    const model = createEditorModel({ namespace: 'html', onError });
    const { importHtmlFx } = createHtmlApi(model);

    await importHtmlFx('<p>hello <b>world</b></p>');

    expect(model.$text.getState()).toBe('hello world');
    model.destroy();
  });

  it('exports the editor content as HTML', async () => {
    const model = createEditorModel({ namespace: 'html', onError });
    const { exportHtmlFx, importHtmlFx } = createHtmlApi(model);

    await importHtmlFx('<p>hello <strong>world</strong></p>');
    const html = await exportHtmlFx();

    expect(html).toContain('hello');
    expect(html.toLowerCase()).toContain('<strong');
    model.destroy();
  });

  it('round-trips content through HTML', async () => {
    const source = createEditorModel({ namespace: 'html', onError });
    const target = createEditorModel({ namespace: 'html', onError });
    const a = createHtmlApi(source);
    const b = createHtmlApi(target);

    await a.importHtmlFx('<p>round trip</p>');
    await b.importHtmlFx(await a.exportHtmlFx());

    expect(target.$text.getState()).toBe('round trip');
    source.destroy();
    target.destroy();
  });
});
