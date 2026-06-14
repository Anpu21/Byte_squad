# Definition of Done — LedgerPro

The per-PR checklist. **Governing standard: the blaxx-memory senior guides** (nestjs, nestjs-auth,
nestjs-validation, react, theprimeagen, jsmastery). `rules.md` is the repo's local convention doc; where
the two differ, **blaxx-memory wins**. Recall the relevant skill (`query_knowledge` / `get_skill`) before
non-trivial work.

---

## Build order (non-negotiable)

**Frontend — components → pages → routes:**
1. **Reusable components first.** Build the composable, presentational building blocks in the feature
   folder (`frontend/src/features/<feature>/components/`) — or `components/ui/` if app-wide. Design by
   **composition, not configuration** (don't add a boolean prop per variant). Unit-test each in isolation.
   *(blaxx react `10 · UI Components`, `01 · Architecture` — organize by feature.)*
2. **Pages second.** A page is a **thin orchestrator**: it composes components, wires server state
   (TanStack Query) and client state, and hosts top-level effects. No inline layout, business logic, or
   filter handling.
3. **Routes last.** Register the slim page as **data** in `src/routes/routes.config.tsx` via
   `FRONTEND_ROUTES`. *(blaxx react `15` — routing is thin infrastructure.)*

**Backend — repository → service → controller:**
- **Repository** owns all persistence (one entity each). **Service** owns business logic and depends on
  the repository. **Controller** is thin transport. Requests flow down, data flows up — crossing a layer
  is a defect. *(blaxx nestjs `00 — Architecture & Layering Contract`, `nestjs-backend-design-patterns`.)*

---

## Frontend checklist
- [ ] New UI was built **component-first** (reusable components landed/extracted before the page).
- [ ] Components ≤ 200 lines, pages ≤ 120 lines (extract before exceeding).
- [ ] Composition over configuration — no "god component" with a prop per variant. *(react-10)*
- [ ] Server state on **TanStack Query** (no fetch-in-`useEffect`); query keys from `queryKeys`.
- [ ] Types imported from the `@/types` barrel; types hand-written only at the edges. *(react-02)*
- [ ] Design tokens only (no raw hex / arbitrary spacing / raw z-index); UI primitives (`Modal`,
      `Button`, …) instead of inline equivalents.
- [ ] SPA nav only (`<Link>`/`useNavigate`); no `window.location` / `window.confirm`.
- [ ] Accessible: real `<button>`s, labels, focus-visible, non-color status signals.
- [ ] Errors split **expected vs unexpected** — expected → inline message/toast; unexpected → reported,
      not swallowed. No `console.*` left in. *(react `09`)*

## Backend checklist
- [ ] New entity has a **repository**; services contain **no** `@InjectRepository` / `typeorm` imports.
- [ ] Cross-module data goes through the owning module's exported **service**, never a borrowed entity.
- [ ] **Branch scope enforced in the service** for non-admin actors (multi-tenant safety is P0). *(nestjs-08)*
- [ ] Every endpoint: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` + `@CurrentUser()`; paths via
      `APP_ROUTES`.
- [ ] Request body has a **DTO class** with `class-validator` decorators; optional fields carry
      `@IsOptional()`. *(nestjs-validation `03`)*
- [ ] Domain errors **throw** NestJS / custom exceptions — never raw `Error`, never a swallowed `catch`.
      The global filter renders the `{ success, data, message }` envelope. *(nestjs `09`, theprimeagen `06`)*
- [ ] Money-touching writes honor `X-Idempotency-Key`. Transactions live in the service.

## Tests (blaxx nestjs `11`, jsmastery `10`, theprimeagen `07`)
- [ ] Happy path **+ key failure modes** covered (not exhaustive e2e).
- [ ] Money paths and multi-tenant isolation have **integration** tests against a real/test DB.
- [ ] Frontend network faked at the HTTP layer (MSW), not by mocking the data module.
- [ ] No `.skip` in main.

## Done gate
`pnpm --filter <pkg> typecheck && lint && test` green, build passes, CI forbidden-pattern gates pass,
manual smoke per affected role, conventional commit.
