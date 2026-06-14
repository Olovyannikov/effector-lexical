import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';

import LexicalDemo from './LexicalDemo.vue';
import PlaygroundDemo from './PlaygroundDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LexicalDemo', LexicalDemo);
    app.component('LexicalPlayground', PlaygroundDemo);
  },
} satisfies Theme;
