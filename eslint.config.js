import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-console': 'off',
      'no-control-regex': 'warn',
      'prefer-const': 'warn',
      'no-case-declarations': 'warn',
      'no-empty': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'release/**', 'node_modules/**', '**/*.js'],
  },
]
