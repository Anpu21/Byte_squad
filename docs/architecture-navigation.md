# Navigation architecture — how to scale the sidebar + sub-nav

> **Status:** proposal / reference. Not yet fully adopted. LedgerPro already
> implements ~70% of this (see §4). This doc explains the target architecture,
> how large products solve the same problem, and a phased path to close the gap.
> Produced as a planning deliverable — nothing here is implemented yet.

---

## 1. TL;DR — the one idea

**Navigation is data, not markup.** Every product that scales this well separates
the problem into four layers and never lets them bleed:

| Layer | What it is | LedgerPro today |
|---|---|---|
| **Model** | A declarative description of *what exists* — items, labels, icons, routes, grouping, ordering, required permissions. Pure, serializable, testable. | `config/navigation/` ✅ |
| **Policy** | *Who may see what* — filter the model by role / feature-flag / scope. Pure functions or hooks. | `useNavTabs` / role filter ✅ (role only) |
| **Chrome** | Dumb components that render whatever policy hands them — `SideNav`, `NavItem`, `Tabs`. No business logic. | `DashboardLayout` / `Tabs` ⚠️ (shell not extracted) |
| **State** | What's *active* — derived from the URL, in one place, feeding sidebar-active + breadcrumb + tab-active together. | split: sidebar exact-match + breadcrumb `useMatches` ⚠️ |

If those four are clean, the sidebar can grow to hundreds of items and the code
stays boring. If they're tangled (role checks in JSX, active-state computed in
four places, tabs hardcoded per page) every nav change is a five-file edit. You
already moved off the tangled version — this doc is about hardening the seams.

---

## 2. How large products actually do it

Six patterns recur. They are not alternatives — mature systems use several.

### Pattern A — Declarative manifest / contribution model
The shell renders whatever is *registered*; features contribute entries into
named locations. The renderer never imports the features.
- **VS Code** — the canonical version. `contributes.menus`, `contributes.viewsContainers` in `package.json`; extensions drop commands/views into menu locations (`view/title`, `editor/context`). Total inversion of control.
- **Backstage (Spotify)** — plugins register routes + sidebar items via a plugin API; the app shell composes them.
- **Salesforce Lightning / ServiceNow** — navigation is *metadata*, edited in an app builder, not code.
- **AWS Console** — each service is a micro-frontend contributing its own nav.

> Takeaway: a **registry** decouples "who declares a nav item" from "who renders the menu." LedgerPro's `SIDEBAR` array is a centralized version of this.

### Pattern B — Route-coupled navigation (the route tree *is* the nav source)
Nav derives from the router; routes carry metadata the nav/breadcrumb reads.
- **Next.js App Router / Remix / TanStack Router** — file-system routing; each *section* is a route segment with its own `layout.tsx` that renders the section's sub-nav. The sub-nav for `/settings/*` lives in `settings/layout.tsx`, not a central file.
- **Linear, Vercel, GitHub** — nested layouts: outer layout = app shell (sidebar); inner layout per section = its tab bar. Each section is self-contained.
- **React Router data router** — route `handle` / `useMatches()` for breadcrumbs (LedgerPro already does this).

> Takeaway: **co-locate a section's sub-nav with that section's layout route.** This is the most scalable answer when sections evolve independently.

### Pattern C — Three-layer model / policy / chrome
Already in the table above. Polaris, Fluent, Carbon, Atlaskit all ship the
*chrome* as design-system primitives parameterized by a *model*, gated by a
*policy*. The renderer is feature-agnostic and fully unit-testable with a fake model.

### Pattern D — Permission/visibility as one cross-cutting predicate
Never `user.role === 'admin' && <Item/>` in JSX. Each node declares what it
requires; one resolver filters the tree.
- **Salesforce / Workday / Atlassian** — every nav node carries required permission(s); a single `canSee(node, ctx)` prunes the tree.
- **Feature flags (LaunchDarkly-style)** — same mechanism: `node.flag && flags.has(node.flag)`.
- Generalizes role + flag + tenant/branch scope into *one* predicate.

### Pattern E — Composition over a central file (at very large scale)
When a manifest becomes a merge-conflict hotspot (hundreds of items, many teams):
- **Per-feature contribution** — each feature folder exports its own `*.nav.ts`; a build-time/runtime aggregator merges by group + explicit `order` weight.
- **Module federation / micro-frontends** — each remote contributes nav at runtime.

> Tradeoff: you lose the "see the whole nav at a glance" property and need tests/tooling to validate the merged tree. **This is premature below ~40 items or a single team** — see §6.

### Pattern F — Active-state & breadcrumb from a *single* match
The highlighted sidebar item, the breadcrumb trail, the page `<title>`, and the
active tab all derive from **one** matching of the URL against the model. Compute
it once (route prefix match or `useMatches`), fan it out. Never four `pathname ===`
checks drifting apart.

### Cross-cutting: a11y & design-system primitives
- WAI-ARIA: sidebar = `nav` landmark (+ disclosure/treeview if nested); tabs = the **Tabs pattern** — `role=tablist/tab/tabpanel`, `aria-controls`/`aria-labelledby`, **roving tabindex + arrow keys**.
- Polaris `Frame`/`Navigation`, Atlaskit `@atlaskit/navigation-system`, Carbon `UIShell` (`SideNav`, `HeaderNavigation`), Material `Drawer`+`List` — every serious DS ships a *named* shell so teams get layout + a11y for free.

---

## 3. The target architecture for LedgerPro

A single **nav tree** (model) → a single **visibility policy** → **shell
primitives** (chrome) → **one URL matcher** (state). Sidebar items and their tabs
are the *same recursive shape*, so one resolver drives active-state, breadcrumbs,
and tabs.

```
                       ┌─────────────────────────────────────┐
   config/navigation/  │  MODEL: NavNode tree (data only)     │
                       │  id, label, route, icon, group,      │
                       │  order, requires[], flag?, children[]│
                       └───────────────┬─────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                               ▼
 ┌─────────────┐              ┌──────────────────┐            ┌────────────────┐
 │ POLICY      │              │ STATE            │            │ INTEGRITY      │
 │ visible(    │              │ useActiveTrail() │            │ tests:         │
 │   node,ctx) │              │  → matches URL   │            │ model⇄router   │
 │ role+flag+  │              │  → active node,  │            │ keys⇄page      │
 │ branch      │              │    crumbs, tab   │            │                │
 └──────┬──────┘              └─────────┬────────┘            └────────────────┘
        │                              │
        └───────────────┬──────────────┘
                        ▼
            ┌────────────────────────────┐
            │ CHROME (design-system)     │
            │  <AppShell>                │
            │    <SideNav items/>        │  ← dumb, props-only
            │    <Workspace tabs/>       │
            └────────────────────────────┘
```

### 3.1 One model: a `NavNode` tree
Sidebar sections and their sub-tabs become the same recursive node. A section is
a node with `children` (its tabs); a leaf tab is a node without children. This is
the GitHub/Linear mental model: **nav is a tree, the URL selects a path through it.**

```ts
// config/navigation/types.ts
export interface NavNode {
  id: string;                          // stable, unique
  label: string;                       // i18n key (sections) or plain (tabs)
  route?: string;                      // FRONTEND_ROUTES.* — leaf/section target
  routeByRole?: Partial<Record<UserRole, string>>;
  icon?: IconType;
  group?: NavGroup;                    // present ⇒ sidebar section
  order?: number;                      // explicit weight (Pattern E-ready)
  requires?: UserRole[];               // visibility (Pattern D)
  flag?: FeatureFlag;                  // future: feature-flag gate
  labelByRole?: Partial<Record<UserRole, string>>;  // Branch hub
  iconByRole?: Partial<Record<UserRole, IconType>>;
  children?: NavNode[];                // a section's tabs
}
```

Your current `NavEntry` + `NavTab` are 90% this already; merging them removes a
type and lets one walker serve both the sidebar and the tabs.

### 3.2 One policy: `visible(node, ctx)`
Replace every inline role check and the per-selector filter with one predicate,
so roles, flags, and branch scope are decided in exactly one place.

```ts
// config/navigation/policy.ts
export interface NavContext { role?: UserRole; flags: Set<FeatureFlag>; }

export function visible(node: NavNode, ctx: NavContext): boolean {
  if (node.requires && !(ctx.role && node.requires.includes(ctx.role))) return false;
  if (node.flag && !ctx.flags.has(node.flag)) return false;
  return true;
}

export const visibleChildren = (n: NavNode, ctx: NavContext) =>
  (n.children ?? []).filter((c) => visible(c, ctx));
```

`useNavTabs(id)` becomes "find node by id → `visibleChildren` → resolve role
labels → `TabItem[]`." `getSidebarSections()` becomes "top-level nodes with a
`group`, filtered by `visible`, grouped + ordered."

### 3.3 One state resolver: `useActiveTrail()`
Match the current URL against the tree **by route prefix** (not exact equality)
and return the active path. Everything downstream consumes this.

```ts
// returns { trail: NavNode[], section, tab } — the matched path through the tree
export function useActiveTrail(): ActiveTrail { /* matchPath over the tree */ }
```

- Sidebar highlights `trail[0]` (the section) → fixes today's bug where `/inventory/add` doesn't light up the *Inventory* item (exact match misses children).
- Breadcrumbs = `trail.map(n => n.label)` (can still be backed by route `handle` for dynamic segments).
- The active tab = `trail` leaf — same source the sidebar uses. No drift.

### 3.4 Named chrome primitives
Extract the shell from `DashboardLayout` into reusable, testable primitives:
`<AppShell>` (sidebar + header + `<main>` scroll container), `<SideNav>`,
`<WorkspaceTabs>` (today's `WorkspacePage` band). `DashboardLayout` becomes
"compose `AppShell` with the nav model" — thin.

### 3.5 Integrity tests (the thing that keeps it honest at scale)
A manifest silently drifts from the router and the pages. Lock it with tests:
- **model ⇄ router**: every `node.route` exists in `routes.config` and is reachable by the declared `requires` roles.
- **keys ⇄ page**: each tabbed section's child `id`s equal the keys the page's `switch` renders (a tiny exported map per page, asserted in a test). Prevents "added a tab to config, forgot the panel."
- **uniqueness / ordering**: ids unique; every sidebar node has a `group`.

---

## 4. Where LedgerPro is today (honest gap analysis)

You're already most of the way there — this is refinement, not a rewrite.

| Capability | Status | Gap to close |
|---|---|---|
| Model as data (`config/navigation/`) | ✅ Strong | Merge `NavEntry`/`NavTab` → one `NavNode` tree (§3.1) |
| Policy layer (role filter in selectors) | ✅ Role only | Generalize to `visible(node, ctx)` incl. flags + branch (§3.2) |
| Chrome is dumb / props-only | ⚠️ Partial | Extract `AppShell`/`SideNav` from `DashboardLayout` (§3.4) |
| Single active-state source | ⚠️ Split | `useActiveTrail()`; prefix-match so child routes highlight parent (§3.3) |
| Breadcrumbs from route metadata | ✅ `useMatches` | Optionally fold into `useActiveTrail` |
| Routes-as-data (nested data router) | ✅ Strong | — |
| `FRONTEND_ROUTES` everywhere | ✅ Strong | — |
| Tabs a11y | ⚠️ `tablist/tab` only | Add `tabpanel`, `aria-controls`, **roving tabindex + arrow keys** |
| Manifest⇄router⇄page tests | ❌ Missing | Add integrity tests (§3.5) |
| Route-level code splitting | ❌ Single 2.2 MB chunk | `lazy()` per section route (§5) |

The two **highest-leverage, lowest-risk** wins are the active-trail resolver
(fixes a real highlight bug + unifies state) and the integrity tests (stops
config/router/page drift as the app grows). The two **most "enterprise"** wins
are the visibility policy (flags-ready) and route-level code splitting.

---

## 5. Bonus: route-level code splitting (your build is asking for it)

The production build currently emits one **2.2 MB** JS chunk and warns about it.
Big consoles never ship the whole app in the initial bundle — each section is
lazy-loaded, so nav scales without bloating first paint. With the data router
this is a per-route change, not an architecture change:

```tsx
const InventoryWorkspacePage = lazy(() => import('@/features/admin-inventory/...'));
// <Route ... element={<Suspense fallback={<AppBootSpinner/>}><InventoryWorkspacePage/></Suspense>} />
```

Split the heavy, role-narrow sections first (reports/charts pulling `xlsx`,
`jspdf`, `html2canvas` — those three alone are ~850 KB and only admins/managers
hit them). This pairs naturally with the nav work since the nav model already
knows which routes are role-narrow.

---

## 6. When to decentralize (don't do it yet)

The central manifest (`config/navigation/`) is **correct for your scale**
(~18 sidebar items, ~9 tabbed sections, one team). Decentralize to per-feature
`*.nav.ts` + an aggregator (Pattern E) only when **two** of these are true:

- nav entries exceed ~40, *or*
- multiple teams edit the manifest weekly and conflict on it, *or*
- features ship as independently-deployed bundles (micro-frontends).

When you cross that line: each feature exports `nav: NavNode` with an `order`
weight; an aggregator imports them (or a Vite `import.meta.glob`) and merges by
`group` + `order`. The integrity tests from §3.5 become mandatory, because no
single file shows the whole tree anymore. Until then, **central is simpler and
more legible** — resist the urge early.

---

## 7. Recommended adoption order (incremental, each shippable)

1. **`useActiveTrail()` + prefix matching** — unify active-state, fix the
   parent-highlight bug. Chrome reads the trail. *(Low risk, visible win.)*
2. **Integrity tests** — model⇄router and keys⇄page. *(Pure safety net.)*
3. **Merge to one `NavNode` tree** — collapse `NavEntry`/`NavTab`; selectors walk
   the tree. *(Mechanical, type-guided.)*
4. **`visible(node, ctx)` policy** — one predicate; wire roles now, leave a `flag`
   seam for later. *(Sets up enterprise gating.)*
5. **Extract `AppShell` / `SideNav` primitives** — thin out `DashboardLayout`,
   make the shell unit-testable. *(Refactor, no behavior change.)*
6. **Tabs a11y completion** — `tabpanel` + roving tabindex + arrow keys.
7. **Route-level code splitting** — `lazy()` the heavy role-narrow sections.

Steps 1–2 are worth doing soon regardless; 3–7 are "when you touch nav next."

---

## References (patterns cited)
- VS Code contribution points · Backstage plugin nav · Salesforce Lightning metadata nav — *declarative registries* (Patterns A, D).
- Next.js App Router / Remix / Linear / Vercel nested layouts — *route-coupled sub-nav* (Pattern B).
- Shopify Polaris `Frame`/`Navigation`, Atlassian `@atlaskit/navigation-system`, IBM Carbon `UIShell`, Microsoft Fluent — *named shell primitives + a11y* (Pattern C, cross-cutting).
- WAI-ARIA Authoring Practices — Tabs pattern, navigation landmarks.
- Internal: `06 · Routing` (route tree as data), `01 · Architecture` (organize by feature), `01 — App Router structure` (group by shell), `nav-central-config` memory.
