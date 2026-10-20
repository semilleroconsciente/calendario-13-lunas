// ESLint mínimo (auditoría 2026-10-20): sin framework, Vanilla JS + IIFE globales.
// Uso: npx --yes eslint .   (no corre en `npm test` para no romper CI offline)
// Reglas enfocadas en seguridad (CSP) e higiene: prohíbe eval, new Function,
// javascript: URLs y catch vacíos; avisa sobre `var` nuevo (usar let/const).
export default [
  {
    ignores: [
      'node_modules/**', 'android/**', 'dist-empaquetado/**',
      'web/**', 'src/anime-v4.js', 'src/jsqr-lib.js', 'src/qrcode-lib.js',
      'src/templates-bundled.js', '**/*.min.js',
    ],
  },
  {
    languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off',
    },
  },
];
