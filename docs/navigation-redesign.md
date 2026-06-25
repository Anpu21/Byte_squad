# Navigation redesign — "Calm Authority" (shipped)

A professional visual + accessibility + token pass over the three nav surfaces
(primary sidebar, top header, workspace sub-nav). Driven by `ui-ux-pro-max` design
intelligence + a best-in-class benchmark (Linear / Stripe / Vercel / GitHub /
Notion / Retool). **No rebrand** (reuses the Ledger UI Kit tokens) and **no
nav-model change** (same routes, roles, tabs; `config/navigation/` untouched).

Branch `feat/pos-mrp-units-table`, commits `83be170`→`e8fa2a8` (Anpu21). See the
longer-term structural plan in [`architecture-navigation.md`](./architecture-navigation.md).

## Direction
"Calm Authority" — Trust & Authority + flat minimalism: one restrained accent
(`--primary`) used only for active nav + the primary CTA; 1px hairlines (no chrome
shadows); calm 150–200ms motion; one unified focus ring; consistent icon stroke
(`strokeWidth={2}`) and size.

## What changed, by surface

### Design tokens (`src/index.css` `@theme`) + `components/ui/icon-sizes.ts`
- Nav metrics kill ~20 hardcoded arbitrary values: `--nav-sidebar-w: 256px`,
  `--nav-rail-w: 64px`, `--nav-drawer-w: 288px`, `--nav-row-h: 40px`,
  `--nav-label-size: 13px`, `--nav-badge-size: 18px`, `--nav-tab-underline: var(--primary)`.
- Icon scale `--icon-xs/sm/md/lg` (12/14/16/18). react-icons take a numeric `size`,
  so the matching constants live in `icon-sizes.ts` (`ICON`, `NAV_ICON`).

### Primary sidebar (`layouts/DashboardLayout.tsx`)
- **Calm active state** (Variant A): `bg-surface-2 text-text-1 font-semibold` + a
  primary-tinted icon. The fragile off-canvas rail (`absolute left-[-13px]`) is
  **deleted** — fill + weight + icon tint carry the state in both themes.
- Tokenized widths/row-height; 18px icons (`strokeWidth={2}`); inactive icons
  `text-text-3 group-hover:text-text-2`.
- Group headers restyled (11px/600); when collapsed they become a hairline
  divider between groups (`[&:not(:first-child)]:border-t`) instead of vanishing.
- Collapsed rail uses an accessible `Tooltip` (not the brittle native `title`);
  links keep `aria-label` + `aria-current`.
- Collapse state persists in `localStorage('nav:sidebar-open')`; `<nav aria-label>` landmark.

### Top header (`layouts/DashboardLayout.tsx`)
- **⌘K command palette** entry — a faux-search button (desktop) / icon (mobile),
  plus a global `(meta|ctrl)+k` shortcut.
- Right controls regrouped (`gap-2` + divider, normalized hit-areas).
- Mobile page-title fallback when breadcrumbs hide (`md:hidden` last crumb).

### Workspace sub-nav (`components/ui/Tabs.tsx` + `WorkspacePage.tsx`)
- **Full WAI-ARIA tabs pattern**: roving `tabIndex`, Arrow/Home/End keys,
  `role=tabpanel` + `aria-controls`/`aria-labelledby` (wired via a shared `idBase`).
- 3px active underline via `--nav-tab-underline`; **solid** sticky band (drops the
  frosted blur + fragile negative-margin math) so it matches the solid header — one
  rail, no doubled border.
- Pill variant + POS mode switch + embedded mode unchanged.

### Unified focus ring
All nav interactive elements (sidebar rows, footer, header controls, theme toggle,
notifications, skip link, tabs) standardized on
`focus-visible:ring-[3px] focus-visible:ring-focus/25` (replaced 3 ad-hoc opacities).

## New components
- `components/ui/CommandPalette.tsx` — ⌘K "go to" palette over `SIDEBAR` +
  sub-tabs, role-filtered like the sidebar, deep-links `?tab=`. **Frontend-only**
  (no backend / entity search). Built on the `Modal` primitive.
- `components/ui/Tooltip.tsx` — portal-based, keyboard-aware visual tooltip for the
  collapsed rail.

## Tests / verification
- `pnpm verify` green: typecheck + lint (0 errors) + **471 tests** (90→92 files) + build.
  New: Tabs keyboard nav (2), Tooltip (2), CommandPalette render/filter/navigate/role-gate (4).
- Boot-checked via `docker restart ledgerpro-frontend` (HTTP 200, clean Vite start).

## Out of scope / deferred
- CommandPalette entity search (transactions/products) — needs backend.
- `AppShell`/`SideNav` extraction — deferred to a later behavior-neutral refactor.
- "More tabs" overflow dropdown — kept as horizontal scroll for now.
