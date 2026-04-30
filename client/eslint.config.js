/* ESLint 9 flat config — 잔향 클라이언트.
 * Phase 0: 핵심 룰만 (no-unused-vars, react-hooks, no-console).
 * Phase 1+에서 a11y, jsx-no-useless-fragment, prefer-const 강화 검토. */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'android/**', 'dev-dist/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: '18.3' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 17+ JSX runtime — import React 불필요
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // _ prefix 변수는 unused 허용
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // any 사용은 경고 (Phase 0 mock data에서 종종 필요)
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      /* react-hooks v7 신규 룰 — Phase 0 mock streaming 패턴(첫 진입 시
       * setState로 리셋 후 setInterval 시작)에서 false positive 다수.
       * Phase 1+ 실 LLM 전환 시 EventSource 기반으로 재작성하며 다시 켬. */
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'no-useless-assignment': 'off',
    },
  },
  {
    /* 테스트 파일은 더 느슨 — describe/it 등 globals 허용 */
    files: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
