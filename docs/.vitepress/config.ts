import { defineConfig } from 'vitepress';
import react from '@vitejs/plugin-react';

// Repo is published at https://olovyannikov.github.io/effector-lexical/
export default defineConfig({
  base: '/effector-lexical/',
  title: 'effector-lexical',
  description: 'Effector bindings for the Lexical text editor',
  lastUpdated: true,
  cleanUrls: true,

  vite: {
    // React transform for the embedded live demo and the library's .tsx source.
    plugins: [react({ include: [/\.tsx$/] })],
  },

  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Olovyannikov/effector-lexical',
      },
    ],
    search: { provider: 'local' },
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Recipes', link: '/recipes/' },
          { text: 'Playground', link: '/playground' },
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
              { text: 'Output formats', link: '/guide/formats' },
              { text: 'Working with LLMs', link: '/guide/llms' },
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
            text: 'Recipes',
            items: [
              { text: 'Overview', link: '/recipes/' },
              { text: 'State sync', link: '/recipes/state' },
              { text: 'Commands & toolbar', link: '/recipes/commands' },
              { text: 'Selection & formatting', link: '/recipes/selection' },
              { text: 'Nodes & content', link: '/recipes/nodes' },
              { text: 'HTML & Markdown', link: '/recipes/serialization' },
              { text: 'Collaboration (Yjs)', link: '/recipes/collaboration' },
              { text: 'Show formatting marks', link: '/recipes/marks' },
              { text: 'Scope, SSR & testing', link: '/recipes/scope' },
            ],
          },
          {
            text: 'Cookbook',
            items: [
              { text: 'Playground', link: '/playground' },
              { text: 'Examples', link: '/examples' },
            ],
          },
        ],
      },
    },

    ru: {
      label: 'Русский',
      lang: 'ru',
      link: '/ru/',
      description: 'Effector-биндинги для редактора Lexical',
      themeConfig: {
        nav: [
          { text: 'Руководство', link: '/ru/guide/getting-started' },
          { text: 'Рецепты', link: '/ru/recipes/' },
          { text: 'Playground', link: '/ru/playground' },
          { text: 'Примеры', link: '/ru/examples' },
          {
            text: 'npm',
            link: 'https://www.npmjs.com/package/effector-lexical',
          },
        ],
        sidebar: [
          {
            text: 'Введение',
            items: [
              { text: 'Что и зачем', link: '/ru/guide/getting-started' },
              { text: 'Установка', link: '/ru/guide/installation' },
              { text: 'Быстрый старт', link: '/ru/guide/quick-start' },
              { text: 'Форматы вывода', link: '/ru/guide/formats' },
              { text: 'Работа с LLM', link: '/ru/guide/llms' },
            ],
          },
          {
            text: 'API',
            items: [
              { text: 'Ядро', link: '/ru/api/core' },
              { text: 'React', link: '/ru/api/react' },
            ],
          },
          {
            text: 'Рецепты',
            items: [
              { text: 'Обзор', link: '/ru/recipes/' },
              { text: 'Синхронизация состояния', link: '/ru/recipes/state' },
              { text: 'Команды и тулбар', link: '/ru/recipes/commands' },
              {
                text: 'Выделение и форматирование',
                link: '/ru/recipes/selection',
              },
              { text: 'Узлы и контент', link: '/ru/recipes/nodes' },
              { text: 'HTML и Markdown', link: '/ru/recipes/serialization' },
              {
                text: 'Совместное редактирование',
                link: '/ru/recipes/collaboration',
              },
              { text: 'Показать символы', link: '/ru/recipes/marks' },
              { text: 'Scope, SSR и тесты', link: '/ru/recipes/scope' },
            ],
          },
          {
            text: 'Кулинарная книга',
            items: [
              { text: 'Playground', link: '/ru/playground' },
              { text: 'Примеры', link: '/ru/examples' },
            ],
          },
        ],
        docFooter: { prev: 'Назад', next: 'Далее' },
        outline: { label: 'На этой странице' },
        lastUpdatedText: 'Обновлено',
        returnToTopLabel: 'Наверх',
        langMenuLabel: 'Сменить язык',
      },
    },
  },
});
