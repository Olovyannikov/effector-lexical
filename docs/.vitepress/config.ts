import { defineConfig } from 'vitepress';

// Repo is published at https://olovyannikov.github.io/effector-lexical/
export default defineConfig({
  base: '/effector-lexical/',
  title: 'effector-lexical',
  description: 'Effector bindings for the Lexical text editor',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Recipes', link: '/recipes' },
      { text: 'Examples', link: '/examples' },
      {
        text: 'npm',
        link: 'https://www.npmjs.com/package/effector-lexical',
      },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What & why', link: '/guide/getting-started' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quick start', link: '/guide/quick-start' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: 'Core', link: '/api/core' },
          { text: 'React', link: '/api/react' },
        ],
      },
      {
        text: 'Cookbook',
        items: [
          { text: 'Recipes', link: '/recipes' },
          { text: 'Examples', link: '/examples' },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Olovyannikov/effector-lexical',
      },
    ],
    search: { provider: 'local' },
  },
});
