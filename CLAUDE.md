# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**LedgerPro** — Multi-branch supermarket POS, inventory, accounting, and customer pickup-order platform. Roles: **Admin** (cross-branch), **Manager** (branch-scoped), **Cashier** (POS only), **Customer** (storefront).

Two packages, one Postgres:

- `backend/` — NestJS 11 · TypeORM · Passport JWT · socket.io · Cloudinary · Nodemailer
- `frontend/` — Vite 7 · React 19 · TS · Tailwind 4 · Redux Toolkit · TanStack Query
- `docker-compose.yml` — Postgres 16 + both apps for local dev

Package manager is **pnpm 10.33.2** (each package has its own lockfile + `save-exact=true`).

---

## Skills & workflow (read first)

Before any non-trivial task, **load and apply** these Claude Code skills throughout the work — not just at review time:

- **`ui-ux-pro-max`** — every frontend change (component, layout, modal, form, page). Use it for visual hierarchy, spacing, motion, accessibility, and dark-mode parity.
- **`everything-claude-code`** — React patterns, TypeScript idioms, NestJS architecture, Docker, testing, refactor heuristics.
- **`frontend-design`** (if installed) — design tokens and component primitives.

At the start of a task, briefly state which skills apply and why. Re-check applicability when scope shifts.

**For audit / planning tasks** (e.g. "find UI issues, give me a plan"), produce a markdown deliverable first and **stop before implementing**. Don't start patching until I've reviewed the plan.

**If a fix requires backend changes from a frontend task — stop and ask.** Don't silently modify backend code.

---

## Coding standards

**All coding standards live in [`rules.md`](./rules.md).** Read it before writing or modifying any code. The 17 sections cover:

1. How to use the document
2. Skill activation
3. Production-SaaS principles
4. TypeScript rules — strict mode, no `any`, discriminated unions, branded IDs, enums-as-const
5. React component rules — naming, props, hooks, performance, forms, conditional rendering
6. TSX & layout rules — design tokens, mandatory UI primitives, z-index scale, accessibility, SPA navigation
7. State management — TanStack Query for server state, Redux for session-critical client state only
8. NestJS Repository Pattern — mandatory three-layer split (repository ↔ service ↔ controller)
9. NestJS controllers — thin, route-via-`APP_ROUTES`, no business logic
10. DTOs and validation — class-validator, no optional fields without `@IsOptional()`
11. Error handling — NestJS exceptions, never raw `Error`
12. Real-time — socket.io patterns, Postgres-persisted notifications
13. Testing — coverage targets, fake-timer hygiene, integration tests hit the real DB
14. File organization — one-thing-per-file (see [`docs/folder-structure.md`](./docs/folder-structure.md))
15. Naming — kebab-case files, PascalCase types, camelCase symbols
16. Commits & PRs — one architectural change per PR
17. Forbidden patterns (auto-reject in code review)

When code in this repo conflicts with `rules.md`, the rule wins — the code is on its way to being fixed.

---

## Key cross-package conventions

- **Always use `APP_ROUTES` (backend) and `FRONTEND_ROUTES` (frontend)** for paths. Never hand-write.
- **Backend filter on `actor.branchId` for non-admins.** Forgetting this is a security bug.
- **Frontend SPA navigation only** — `<Link>` / `useNavigate()`. Never `window.location.*`. CI typecheck and the audit codemod will catch slips.
- **No `window.confirm()`** — use `useConfirm()`.
- **No inline modal divs** — wrap with `<Modal>` from `components/ui/`.
- **Idempotency keys on POS checkout** — `X-Idempotency-Key` header guards double-submit.
- **New backend modules use the Repository Pattern** (`rules.md` §7). No `@InjectRepository` in new service files.
- **One thing per file** — services, controllers, repositories, modules, entities, components, hooks, and interfaces each get their own file. Domain types live under `<module>/types/<name>.type.ts` (backend) or `frontend/src/types/<domain>/<name>.type.ts`. See [`docs/folder-structure.md`](./docs/folder-structure.md) for the exception list.
- **Always import frontend types from `@/types`** — never reach into `@/types/<domain>/<file>` directly. The barrel is the contract.
- **Full forbidden-patterns list:** `rules.md` §17.

---

## Deep dives (load on demand)

Open these only when the task touches the area:

- [`docs/folder-structure.md`](./docs/folder-structure.md) — repo / backend / frontend trees, file-naming + one-thing-per-file conventions, barrel pattern
- [`docs/architecture-backend.md`](./docs/architecture-backend.md) — module layout, repository-pattern status per module, auth/RBAC, response shape, real-time, seeding, stock-transfer state machine
- [`docs/architecture-frontend.md`](./docs/architecture-frontend.md) — routing, state split, design system, UI primitives, charts, live updates, types domain organization, testing setup
- [`docs/commands.md`](./docs/commands.md) — pnpm/PM2/Docker commands, CI workflow notes
- [`docs/seeded-accounts.md`](./docs/seeded-accounts.md) — dev login credentials
