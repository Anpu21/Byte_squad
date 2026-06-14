// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ── Forbidden-pattern ratchet (governed by blaxx-memory; see docs/definition-of-done.md) ──
// Known-debt categories are 'warn' and flip to 'error' in the phase that clears them
// (raw Error → Phase 2; @InjectRepository/typeorm-in-service → Phase 3; size → Phase 5).
const RAW_ERROR = {
  selector: "ThrowStatement > NewExpression[callee.name='Error']",
  message:
    'Throw a NestJS or custom domain exception, not raw Error (blaxx nestjs-09 / DoD).',
};
const INJECT_REPOSITORY = {
  selector: "Decorator[expression.callee.name='InjectRepository']",
  message:
    'Services own no persistence — inject a repository class, not @InjectRepository (blaxx nestjs-00 / DoD).',
};

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'no-console': 'warn', // Logger over console
    },
  },
  {
    // Repositories own persistence but still must not throw raw Error.
    files: ['**/*.repository.ts'],
    rules: { 'no-restricted-syntax': ['warn', RAW_ERROR] },
  },
  {
    // Services: no raw Error, no @InjectRepository (DataSource for transactions is fine).
    files: ['**/*.service.ts'],
    rules: {
      'no-restricted-syntax': ['warn', RAW_ERROR, INJECT_REPOSITORY],
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }], // Phase 5: split mega-services
    },
  },
  {
    // CLI scripts, migrations, and tests may log.
    files: ['**/scripts/**', '**/migrations/**', '**/*.spec.ts'],
    rules: { 'no-console': 'off', 'max-lines': 'off' },
  },
);
