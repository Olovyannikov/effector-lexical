import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';

import LexicalDemo from './LexicalDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LexicalDemo', LexicalDemo);
  },
} satisfies Theme;
