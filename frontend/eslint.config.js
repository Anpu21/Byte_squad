import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ── Forbidden-pattern ratchet (governed by blaxx-memory; see docs/definition-of-done.md) ──
// Patterns the audit found already clean are 'error' (fail on any NEW violation).
// Known-debt categories are 'warn' and flip to 'error' in the phase that clears them.
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // enforced now — codebase already clean
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='window'][callee.property.name=/^(confirm|alert|prompt)$/]",
          message:
            'Use useConfirm()/toast — never window.confirm/alert/prompt (blaxx react-10 / DoD).',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/types/*/*', '@/types/*/**'],
              message:
                'Import types from the @/types barrel, not deep domain paths (DoD).',
            },
            {
              group: ['@/pages', '@/pages/*', '@/pages/**'],
              message:
                'pages/ was removed in the feature-based migration — every screen lives in its feature. Import via @/features/<feature> (its barrel).',
            },
          ],
        },
      ],
      // ratchet — visible now, flip to 'error' in the noted phase
      'no-console': 'error', // enforced (Phase 2) — surface failures via toast, not console
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }], // enforced (Phase 5) — components ≤ 200
    },
  },
  {
    // The @/types barrel composes domain types internally — deep imports allowed here only.
    files: ['src/types/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Tests may log and run long.
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
    rules: { 'no-console': 'off', 'max-lines': 'off' },
  },
])
