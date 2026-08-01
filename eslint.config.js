import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // The whole point of this migration: no escape hatch back to `any`.
      '@typescript-eslint/no-explicit-any': 'error',
      // Unused-var checking is handled by TypeScript itself (noUnusedLocals/
      // noUnusedParameters in tsconfig.json) with a leading-underscore
      // escape hatch that this rule doesn't share, so the JS one is
      // disabled here to avoid two slightly different opinions on the same
      // thing; the TS-aware version keeps working.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // TypeScript itself (not this plain-JS rule) is the source of truth
      // for undefined references — it understands ambient lib types (e.g.
      // FrameRequestCallback) that this rule has no visibility into and
      // would otherwise flag as undefined globals.
      'no-undef': 'off',
    },
  },
  // Config/tooling files (this file, vite.config.ts) run under Node, not
  // the browser — separate globals rather than mixing both into every file.
  {
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Last, so it can disable any stylistic rule that would otherwise fight
  // Prettier's formatting.
  eslintConfigPrettier,
);
