import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import solidPlugin from 'eslint-plugin-solid';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist', 'node_modules', 'build', 'coverage', '.vite'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        jsx: true,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      solid: solidPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...solidPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-undef': 'warn',

      // ========================================
      // SolidJS-specific rules
      // ========================================
      'solid/prefer-for': 'warn',
      'solid/reactivity': 'warn',
      'solid/style-prop': 'warn',
      'solid/no-destructure': 'warn', // Prevent destructuring props (breaks reactivity)
      'solid/jsx-no-duplicate-props': 'error',
      'solid/jsx-no-undef': 'error',
      'solid/jsx-uses-vars': 'error',
      'solid/no-innerhtml': 'error', // XSS prevention
      'solid/no-react-deps': 'warn', // Catch React patterns that don't work in Solid
      'solid/no-react-specific-props': 'warn',
      'solid/self-closing-comp': 'warn',
      'solid/prefer-show': 'warn', // Prefer <Show> over ternary for conditional rendering

      // ========================================
      // Security-focused rules
      // ========================================
      // Prevent eval and similar dangerous patterns
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Prevent potential XSS vectors
      'no-script-url': 'error',

      // Prevent prototype pollution
      'no-proto': 'error',
      'no-extend-native': 'error',

      // Prevent potential injection issues
      'no-useless-escape': 'warn',

      // Prevent accidental data exposure
      'no-alert': 'warn',

      // Ensure proper error handling
      'no-throw-literal': 'error',

      // Prevent potential security issues with regex
      'no-control-regex': 'error',
      'no-invalid-regexp': 'error',
    },
  },
];
