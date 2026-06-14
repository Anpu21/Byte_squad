// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ── Forbidden-pattern ratchet (governed by blaxx-memory; see docs/definition-of-done.md) ──
// Cleared categories are now 'error' (raw Error in services/repos — Phase 2;
// @InjectRepository in services — Phase 3). Size stays 'warn' until Phase 5.
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

// ── Service-only modules (Phases A–F): each exports only its service, so no
// sibling module may import its repository. Cross-module reads go through the
// owner service (blaxx nestjs-07 / DoD). The owner module keeps importing its
// own repository; the seed composition-root (outside src/modules) is exempt. ──
const SERVICE_ONLY_REPOS = {
  users: ['@users/users.repository', '@/modules/users/users.repository'],
  branches: [
    '@branches/branches.repository',
    '@/modules/branches/branches.repository',
  ],
  inventory: [
    '@inventory/inventory.repository',
    '@/modules/inventory/inventory.repository',
  ],
  accounting: [
    '@accounting/accounting.repository',
    '@accounting/accounts.repository',
    '@/modules/accounting/accounting.repository',
    '@/modules/accounting/accounts.repository',
  ],
  products: [
    '@products/products.repository',
    '@/modules/products/products.repository',
  ],
  pos: [
    '@pos/pos.repository',
    '@pos/sale.repository',
    '@/modules/pos/pos.repository',
    '@/modules/pos/sale.repository',
  ],
};
const ALL_SERVICE_ONLY_REPOS = Object.values(SERVICE_ONLY_REPOS).flat();
const banRepoImports = (paths) => [
  'error',
  {
    paths: paths.map((name) => ({
      name,
      message:
        'Cross-module data access goes through the owner *.service, not its repository (blaxx nestjs-07 / DoD).',
    })),
  },
];

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
    rules: { 'no-restricted-syntax': ['error', RAW_ERROR] },
  },
  {
    // Services: no raw Error, no @InjectRepository (DataSource for transactions is fine).
    files: ['**/*.service.ts'],
    rules: {
      'no-restricted-syntax': ['error', RAW_ERROR, INJECT_REPOSITORY],
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }], // Phase 5: split mega-services
    },
  },
  {
    // CLI scripts, migrations, and tests may log.
    files: ['**/scripts/**', '**/migrations/**', '**/*.spec.ts'],
    rules: { 'no-console': 'off', 'max-lines': 'off' },
  },
  {
    // Seed services bulk-populate every entity by design — they are seeders,
    // not domain code, so the repository-pattern gate and size budget don't apply.
    files: ['**/seeds/**'],
    rules: { 'no-restricted-syntax': 'off', 'max-lines': 'off', 'no-console': 'off' },
  },
  {
    // Lock-in: every feature module bans importing the service-only repositories.
    files: ['src/modules/**/*.ts'],
    rules: { 'no-restricted-imports': banRepoImports(ALL_SERVICE_ONLY_REPOS) },
  },
  // Each owner module re-allows its OWN repository (bans only the others).
  ...Object.keys(SERVICE_ONLY_REPOS).map((owner) => ({
    files: [`src/modules/${owner}/**/*.ts`],
    rules: {
      'no-restricted-imports': banRepoImports(
        Object.entries(SERVICE_ONLY_REPOS)
          .filter(([m]) => m !== owner)
          .flatMap(([, p]) => p),
      ),
    },
  })),
);
