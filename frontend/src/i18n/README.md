# Internationalization (i18n)

LedgerPro uses **i18next** + **react-i18next**. Languages: English (`en`, default/fallback) and
Tamil (`ta`). The active language is detected from `localStorage` (`lp-lang`) and, for a signed-in
user, **persisted to their profile** (`users.language`) so it follows them across devices.

## Layout

```
src/i18n/
  config.ts        SUPPORTED_LANGUAGES, NAMESPACES, LANG_STORAGE_KEY, isSupportedLanguage
  index.ts         i18next.init (resources, fallbackLng, localStorage detection)
  resources.ts     imports every locale JSON and maps it to { en, ta }
  LanguageSync.tsx  applies the profile language on login/boot
  locales/
    en/<namespace>.json    English source (source of truth)
    ta/<namespace>.json     Tamil — same keys; English placeholders until translated
```

Persistence / switching:
- `hooks/useLanguage.ts` — localStorage + `<html lang>` + cross-tab sync (the low-level store).
- `hooks/useLanguagePreference.ts` — what the profile `LanguageSwitcher` uses: applies instantly
  **and** persists to the profile when authenticated.
- `i18n/LanguageSync.tsx` (mounted in `App.tsx`) — on login/reload, applies `auth.user.language`.

## How a string becomes translatable (the per-module recipe)

Each feature/area gets **one namespace** (e.g. `pos`, `inventory`, `accounting`, `dashboard`).
Roll out module by module; missing `ta` keys fall back to English, so the UI never breaks mid-way.

1. **Create the namespace files** `locales/en/<ns>.json` and `locales/ta/<ns>.json`.
   - `en` holds the real English text.
   - `ta` mirrors the **same keys** with **English placeholder values** for a translator to fill
     (keep any Tamil that already exists). Keep the key trees identical between `en` and `ta`.
2. **Register it**: add the four imports + the `<ns>` entries in `resources.ts`, and add `'<ns>'`
   to `NAMESPACES` in `config.ts`.
3. **Wire the components**: `const { t } = useTranslation('<ns>')` and replace each hardcoded
   string with `t('some.key')`. For shared chrome (buttons, nav, confirm dialogs) use the `common`
   namespace instead of a new one.
   - Interpolation: `t('greeting', { name })` ↔ `"greeting": "Hi {{name}}"`.
   - Plurals/counts: `t('items', { count })` ↔ `items_one` / `items_other`.
   - Strings outside components (module-level arrays, e.g. nav items) store the **key**, and the
     component calls `t(key)` at render — see `config/navigation.ts` (`SIDEBAR` +
     `GROUP_LABEL_KEY`), consumed by `layouts/DashboardLayout.tsx`.
4. **Verify**: switch to Tamil in profile settings → translated keys flip; un-filled keys show the
   English placeholder. `pnpm typecheck` + `pnpm test`.

## Rollout order (one namespace + PR each)

`common`/shell + `dashboard` (done as the template) → `pos` → `inventory` → `accounting` →
`customer-orders` → `hr` → storefront/customer screens.

## Tooling (recommended)

To find and sync keys mechanically, add **i18next-parser**:

```bash
pnpm add -D i18next-parser
```

`i18next-parser.config.js` (scan `t()` usage, write/merge `en`/`ta` JSON, keep removed keys for
review):

```js
export default {
  locales: ['en', 'ta'],
  defaultNamespace: 'common',
  input: ['src/**/*.{ts,tsx}'],
  output: 'src/i18n/locales/$LOCALE/$NAMESPACE.json',
  keepRemoved: true,
  sort: true,
}
```

Then `pnpm exec i18next-parser` after each module to surface missing/added keys.

## Translation hand-off

Engineering scaffolds keys + English; a native speaker fills `locales/ta/*.json`. Flag domain
terms for accuracy: ledger, GRN, tender, void, invoice, payable/receivable, fulfilment.
