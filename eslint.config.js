import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import effector from 'eslint-plugin-effector';
import lexical from '@lexical/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/coverage',
      'docs/.vitepress/cache',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Lexical rules-of-lexical: $-prefixed helpers used only in valid contexts.
  lexical.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // effector idioms — enforced on library + example sources (typed linting).
  // Tests are excluded: they legitimately read state via getState and observe
  // through watch.
  {
    files: ['src/**/*.{ts,tsx}', 'examples/*/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { effector },
    rules: {
      ...effector.configs.recommended.rules,
      ...effector.configs.react.rules,
      // Our hooks return units from context, they don't create them.
      'effector/no-units-spawn-in-render': 'off',
    },
  },
  prettier,
);
