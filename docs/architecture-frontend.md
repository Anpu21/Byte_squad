# Frontend architecture

Vite 7 · React 19 · TypeScript (strict) · Tailwind 4 (CSS-first) · Redux Toolkit
· TanStack Query · React Router. Companion to `docs/folder-structure.md`.

---

## Routing

- One **central registry**: `routes/routes.config.tsx` declares a `ROUTES` array;
  `buildRouteElement.tsx` composes `element → innerWrap → layout → guard`;
  `AppRouter.tsx` mounts it.
- **Paths are never hand-written** — always `FRONTEND_ROUTES` from
  `constants/routes.ts`. Legacy paths resolve through `*Redirect` components.
- Guards: `ProtectedRoute` (default; role-gated via `allowedRoles`, first-login →
  `/change-password`) and `PublicRoute` (bounces authed users to their role home).
  `SmartRedirect` sends `/` to the role-appropriate home.
- Layouts: `AuthLayout`, `DashboardLayout`, `CustomerLayout`.
- Each routable screen is a `<Feature>Page` exported from its feature barrel; the
  registry imports `@/features/<feature>`. There is no separate `pages/` tree.
- **SPA navigation only** — `<Link>` / `useNavigate()`. Never `window.location.*`.

## State

- **Server state → TanStack Query.** Query keys are centralized in
  `lib/queryKeys.ts`. Feature query hooks live in `features/<x>/hooks/`. HTTP goes
  through per-domain files in `services/` over one axios client (`services/api.ts`,
  which owns auth header, 401 logout, and error toasts).
- **Client state → Redux Toolkit**, only for session-critical data: `auth`,
  `shopCart`, `shopBranch`, `adminContext` (persisted); POS `cart` is intentionally
  not persisted. Selectors live beside slices in `store/`.
- Ephemeral UI state stays local (`useState`/`useReducer`). URL-synced tabs use the
  shared `useTabParam` hook.

## Design system

CSS-first tokens in `index.css` via Tailwind 4 `@theme`. **Use tokens, never raw
hex.** Brand indigo `#19183B`, sage accent `#4A8073`, soft-mint canvas; full
light/dark (`[data-theme="dark"]`); radius 6/8/12; shadow `xs→lg`; a layered
z-index scale (`z-sticky`…`z-toast`); fonts Geist / Geist Mono / Noto Sans Tamil;
`prefers-reduced-motion` honored globally.

### Primitives — `components/ui/` (import via `@/components/ui`)

Actions/inputs: `Button`, `Input`, `Select`, `Segmented`, `Stepper`.
Surfaces: `Card` (+ Header/Title/Description/Content/Footer), `Modal`,
`ConfirmDialog`, `PageHeader`, `Toolbar`, `FilterBar`.
Data: `Table` (+ `TableHead/Body/Row/HeaderCell/Cell`), `DataTable`,
`Pagination`, `KpiCard`, `Spark`, `EmptyState`, `Skeleton`.
Status/identity: `Pill`, `StatusPill`, `Avatar`, `Logo`.
Chrome: `Tabs`, `ThemeToggle`, `LanguageSwitcher`, `AppBootSpinner`.

Mandatory usage:
- **Modals** → `<Modal>` (never inline overlay divs). Destructive confirms →
  `useConfirm()` (never `window.confirm`).
- **Data-dense tables** → `DataTable` (column-driven; loading skeletons, empty
  state, sticky header, sortable headers with `aria-sort`, clickable rows) or the
  composable `Table` parts. Don't hand-roll `<table>` markup.
- **List screens** → `FilterBar` (search + filters) above the table, `Pagination`
  in the footer, both inside a `Card`.

### Density (two modes, one token set)

- **Compact** — dashboard, POS, accounting, inventory. Tight padding, 13px data
  text, `tabular-nums` for numbers, dense rows, `shadow-xs/sm`, status colors for
  state. This is the `DataTable`/`Table` default.
- **Comfortable** — storefront (catalog, product detail, cart, checkout). More
  whitespace, larger imagery, sage accent more prominent, `shadow-sm/md`. Same
  primitives, warmer rhythm (achieved with spacing/size props, not new tokens).

### Quality bar (every screen)

Contrast ≥ 4.5:1 in both themes · visible focus rings · full keyboard nav ·
transitions 150–300ms · SVG icons only (Lucide), never emoji · tabular figures in
data columns · dark-mode parity checked independently.

## Real-time

socket.io client in `services/socket.service.ts`; notifications are
Postgres-persisted and surfaced through `components/notifications/` + the
notifications feature.

## Types

20 domain folders under `types/`, each barrelled, re-exported by the top-level
`types/index.ts`. **Always import from `@/types`** — never reach into
`@/types/<domain>/<file>`.

## Testing

Vitest + Testing Library. Co-locate tests in `__tests__/` next to the code under
test (hooks, lib, components). Run `pnpm test` (or inside Docker:
`docker exec ledgerpro-frontend pnpm test`). Typecheck with `pnpm typecheck`.

## Local dev (Docker, WSL2)

The stack runs via `docker-compose` (`ledgerpro-frontend|backend|postgres`);
`frontend/src` is bind-mounted into the container. If edits don't appear, the
Vite watcher missed a bind-mount change — `docker restart ledgerpro-frontend`
(or `docker compose up -d frontend`) and hard-refresh. Run typecheck/tests
inside the container, where `node_modules` lives.
