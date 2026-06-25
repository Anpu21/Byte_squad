# Folder structure & file conventions

Source of truth for where code lives and how files are named. The frontend is
mid-migration to a **feature-based** layout; this document defines the target
shape every feature converges on. When existing code disagrees with this doc,
the doc wins — that code is on its way to being migrated.

> One thing per file. Services, controllers, repositories, modules, entities,
> components, hooks, and interfaces each get their own file.

---

## Repository

```
Byte_squad/
├── backend/          NestJS 11 · TypeORM · Passport JWT · socket.io
├── frontend/         Vite 7 · React 19 · TS · Tailwind 4 · Redux Toolkit · TanStack Query
├── docs/             these deep-dive docs
├── docker-compose.yml
├── rules.md          coding standards (authoritative)
└── CLAUDE.md         agent guidance
```

---

## Frontend — `frontend/src/`

```
src/
├── components/
│   ├── ui/           SHARED design-system primitives (the only place primitives live)
│   ├── charts/       shared chart wrappers (Recharts)
│   ├── common/       cross-feature shared widgets (e.g. ExportMenu)
│   ├── notifications/ app-wide notification chrome
│   └── Scanner/      shared barcode/QR scanner
├── features/         FEATURE MODULES — the bulk of the app (see "Feature shape")
├── layouts/          AuthLayout · DashboardLayout · CustomerLayout
├── routes/           central route registry (routes.config.tsx, guards, redirects)
├── hooks/            app-wide hooks (useAuth, useConfirm, useTabParam, useTheme…)
├── services/         per-domain API layer over one axios client (api.ts)
├── store/            Redux Toolkit slices + selectors (session-critical state only)
├── types/            domain/server types, barrelled per domain (@/types is the contract)
├── lib/              framework-agnostic utilities (cn, formatCurrency, queryKeys…)
├── constants/        FRONTEND_ROUTES, enums
├── i18n/             i18next config + en/ta locales
└── App.tsx · main.tsx
```

### Feature shape (canonical)

Every feature folder under `features/<feature>/` follows the same shape. Only
include the subfolders a feature actually needs.

```
features/<feature>/
  <Feature>Page.tsx   routable screen entry — present only if the feature owns a route
  components/         presentational + composite components (incl. feature-owned modals)
  hooks/              feature state + TanStack Query hooks   (+ __tests__/)
  lib/                pure helpers: formatting, validation, math   (+ __tests__/)
  types/              feature-LOCAL UI types only (NOT domain/server types)
  index.ts            barrel — the feature's public surface and import contract
```

Rules:

- **The barrel is the contract.** Import a feature only via `@/features/<feature>`.
  No deep cross-feature imports (`@/features/x/components/Y`) and no
  page-imports-page. A feature's `index.ts` exports its `Page` plus any
  components/hooks other features legitimately reuse.
- **Domain/server types stay in `@/types`.** Only types that exist purely to
  shape this feature's UI (form-error maps, row view-models) live in
  `features/<feature>/types/`.
- **Routable screens are `<Feature>Page.tsx`** and live in the feature, not in a
  separate `pages/` tree. The central registry imports them from the barrel.
- A feature must own at least real components or a screen. A folder that holds
  only a tab-manager hook is **not** a feature — fold it into the owning
  workspace feature or a shared `hooks/` helper.

### Naming

| Kind | Convention | Example |
|------|-----------|---------|
| Routable screen | `<Name>Page.tsx` | `PosPage.tsx`, `InventoryWorkspacePage.tsx` |
| Tab body inside a workspace screen | `<Name>View.tsx` | `EmployeesView.tsx` |
| Component | `PascalCase` noun | `TransferBoardTable.tsx` |
| Hook | `useXxx.ts` (camelCase) | `useTransferBoardData.ts` |
| Pure helper / type file | kebab-case | `format-time-ago.ts`, `sellable-unit-row.type.ts` |
| Folder | kebab-case; keep a role prefix only for genuine role splits | `loyalty` + `admin-loyalty` |

### Shared vs. feature-specific

Code lives in `components/` (shared) **only** if it is genuinely cross-feature:
the `ui/` primitives, `charts/`, `common/`, `notifications/`, `Scanner/`.
Anything tied to one domain belongs in that feature's `components/`. Domain
widgets must not accumulate under `components/<domain>/`.

---

## Backend — `backend/src/` (summary)

New modules use the **Repository Pattern**: a three-layer split of
`repository ↔ service ↔ controller`, one class per file. Domain types live under
`<module>/types/<name>.type.ts`. Controllers are thin and route via
`APP_ROUTES`. See `rules.md` §8–§9 and `docs/architecture-backend.md`.
