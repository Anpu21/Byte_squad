# rules.md — LedgerPro Engineering Rules

Canonical coding standards for LedgerPro. Linked from `CLAUDE.md`. Read this before writing or modifying any code. When a rule here conflicts with code you find in the repo, **the rule wins** — the existing code is on its way to being fixed.

---

## 0. How to use this document

- These are not suggestions. Every PR is reviewed against them.
- When in doubt, prefer the rule that produces more boring, predictable code.
- If a rule is genuinely wrong for a situation, document the exception in the PR description with a sentence of justification.
- **Never silently violate a rule** because it's faster. Slow PRs are cheap; broken production is not.

---

## 1. Skill activation

Claude Code must load and actively apply these skills throughout every task on this repo:

- **`ui-ux-pro-max`** — every frontend change (new component, layout, modal, form, page). Not just for "design tasks" — every interaction surface is a design decision.
- **`everything-claude-code`** — React patterns, TypeScript idioms, NestJS architecture, Docker, testing, refactor heuristics.
- **`frontend-design`** (if available) — design tokens, component primitives, responsive behavior.

- **`llm-council`** (.claude/skills) — for making critical thinking before implmeation use this skills and provide proper implemention plan this skills must use other skills during the plan implemenation

At the start of any non-trivial task, list which skills apply and why. Re-check skill applicability when scope changes mid-task.

---

## 2. Production-SaaS principles

The five rules that override all others:

1. **Multi-tenant safety first.** Every query that touches user data must filter by `branchId` (for non-admin actors) or by the user's own scope. Forgetting this is a P0 security bug, not a missed feature.
2. **No silent failures.** If something goes wrong, the user sees a clear message and the server logs the cause. Never swallow errors.
3. **No magic.** No hidden side effects, no global mutable state, no "this works because of X three files away." If a reader can't trace cause-and-effect within one file plus one obvious import, refactor.
4. **Idempotency on writes.** Any endpoint that creates money-touching records (POS checkout, refunds, stock transfers) honors `X-Idempotency-Key`. Re-running the same request produces the same result, not duplicates.
5. **Boring beats clever.** Two clear lines beat one cryptic one. We optimize for the developer reading this in six months at 11pm.

---

## 3. TypeScript rules

- **Strict mode is non-negotiable.** `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- **No `any`.** If you genuinely don't know the type, use `unknown` and narrow with type guards. `any` in a PR requires a comment explaining why and a TODO with a ticket reference.
- **No type assertions (`as Foo`)** except for narrowing after a runtime check, or for `as const`. Never `as unknown as Foo`.
- **Interfaces for object shapes that get extended; type aliases for unions, intersections, and utilities.**
- **Use `type` imports for type-only imports:** `import type { Foo } from './foo'`. Keeps runtime imports clean.
- **Discriminated unions for state machines.** Don't represent state as a bag of optional fields.

  ```ts
  // ❌ Bag of optionals — every consumer has to check three things
  type Order = { status: string; paidAt?: Date; cancelledAt?: Date; error?: string };

  // ✅ Discriminated union — the compiler enforces correctness
  type Order =
    | { status: 'pending' }
    | { status: 'paid'; paidAt: Date }
    | { status: 'cancelled'; cancelledAt: Date }
    | { status: 'failed'; error: string };
  ```

- **Branded types for IDs** that should not be interchangeable: `type UserId = string & { __brand: 'UserId' }`. Prevents passing a `BranchId` where a `UserId` is expected.
- **Use utility types** (`Pick`, `Omit`, `Partial`, `Required`, `Readonly`) instead of redeclaring shapes.
- **Enums must be `as const` objects, not TypeScript `enum`** — enums have runtime surprises and don't tree-shake well.

  ```ts
  export const UserRole = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    CUSTOMER: 'customer',
  } as const;
  export type UserRole = (typeof UserRole)[keyof typeof UserRole];
  ```

---

## 4. React component rules

### Structure & naming

- **One component per file.** Filename matches export: `Button.tsx` exports `Button`.
- **PascalCase for components, camelCase for hooks** (`useFoo`).
- **No default exports for components.** Named exports only. Default exports break refactor rename tools and create import name drift across the codebase.
  - Exception: route page modules that React Router lazy-loads — document with a comment.
- **Group by feature, not by type.** A `customer-requests/` folder owns its page, components, hooks, types. Avoid the `components/`, `hooks/`, `utils/` mega-folders that grow forever.

### Props

- **Props interface declared above the component, suffixed `Props`:**

  ```tsx
  interface InvoiceCardProps {
    invoice: Invoice;
    onPay?: (id: string) => void;
  }

  export function InvoiceCard({ invoice, onPay }: InvoiceCardProps) { ... }
  ```

- **No prop drilling beyond 2 levels.** Lift state to a common parent, use context, or pull from Redux/TanStack Query.
- **Optional callback props named `onX`. Handler implementations named `handleX`.** `onPay` is the prop; `handlePayClick` is the function passed to it.
- **Children typed explicitly:** `children: React.ReactNode`. Never `children?: any`.

### Hooks

- **Hook rules are absolute.** No conditional hook calls. No hooks inside loops. ESLint's `react-hooks/exhaustive-deps` warning is an error in CI.
- **Extract custom hooks** when the same `useState`/`useEffect` pattern appears in two components. Name them by what they return: `useCustomerRequests()`, not `useFetchAndStore()`.
- **Server state goes in TanStack Query, not `useState` + `useEffect`.** Hand-rolled fetch hooks are forbidden unless the endpoint is a one-shot mutation.

### Performance

- **Don't preemptively memoize.** `useMemo`/`useCallback` ship complexity. Add them only when a profiler shows a real cost.
- **`React.memo` only at component boundaries that re-render hot.** Wrapping every leaf is anti-pattern.
- **Lazy-load route components** via `React.lazy` + `Suspense` for code splitting.

### Forms

- **Use `react-hook-form`** for any form with more than one field. Use `zod` resolvers for validation; share schema with the API DTO where possible.
- **Controlled inputs only.** No `defaultValue` on inputs that the user can change.

### Conditional rendering

- **`condition && <Element />`** for simple cases.
- **Ternary `condition ? <A /> : <B />`** when both branches render.
- **Early `return null` over deep ternary trees.** Three nested ternaries → refactor.

---

## 5. TSX & layout rules

### Design tokens (mandatory)

- **Never** use raw color/spacing values: no `bg-[#123456]`, no `text-slate-600`, no `border-white/10`, no `mt-[7px]`.
- **Always** use semantic tokens from `frontend/src/index.css` exposed via `@theme`: `bg-surface`, `text-text-1`, `text-text-2`, `border-border-strong`, `text-danger`, `text-accent`, `bg-primary-soft`, etc.
- If you need a token that doesn't exist, **add it to `index.css`** with both light and dark values, then use it. Don't inline.

### UI primitives are mandatory

Always use these from `frontend/src/components/ui/` instead of building inline:

- `Modal` — never write a raw `<div>` with `fixed inset-0`. The primitive handles focus trap, ESC, scroll lock, exit animation.
- `Input`, `Button`, `Card`, `KpiCard`, `Pill`, `StatusPill`, `Avatar`, `EmptyState`, `Toolbar`, `PageHeader`, `Segmented`, `Stepper`, `ThemeToggle`
- `useConfirm()` from `hooks/useConfirm.tsx` for any "are you sure" flow. **No `window.confirm()`** anywhere in the codebase.

### Z-index

- Only use the scale: `z-sticky`, `z-dropdown`, `z-overlay`, `z-modal`, `z-toast`.
- **Never** raw `z-10`, `z-50`, `z-[9999]`. They guarantee a stacking bug.

### Layout

- **Mobile-first.** Default styles target the smallest breakpoint; use `sm:`, `md:`, `lg:` to scale up.
- **Container widths consistent** across pages: use the existing `PageHeader` and dashboard layout containers; don't invent new max-widths.
- **Spacing scale: 4-point.** `gap-2`, `gap-4`, `gap-6`, `gap-8`. No `gap-3.5`.
- **Sticky headers/toolbars** use `z-sticky`, not raw z-index.

### Accessibility

- **Every interactive element is keyboard-reachable.** If you write `<div onClick>`, you've made a bug. Use `<button>`.
- **Form inputs have associated `<label>`s.** `aria-label` is the fallback, not the default.
- **Focus visible:** `focus-visible:ring-*` on every clickable. The design system already provides this — don't override it away.
- **Color is never the only signal.** Status pills carry an icon or text label in addition to color.
- **`alt` on every image.** Decorative images get `alt=""`.

### SPA navigation

- **`<Link>` and `useNavigate()` only.** Never `window.location.href = …`, never `<a href="/internal-route">`.
- **`<a href>` is only for external URLs or download links.** Include `target="_blank" rel="noopener noreferrer"` for `target="_blank"`.

---

## 6. State management rules

- **Server state → TanStack Query.** Query keys are cross-component contracts; document them in a `queryKeys.ts` file per feature and import from there. Never duplicate query key strings.
- **Session-critical client state → Redux Toolkit.** Auth, shopping cart. That's it.
- **Local UI state → `useState`.** Don't reach for Redux for a modal-open boolean.
- **Form state → `react-hook-form`.** Not Redux, not `useState`.
- **Derived state is computed, not stored.** If you can compute it from props or other state, do.

---

## 7. NestJS — Repository Pattern (mandatory for new code)

This is the biggest architectural shift from the existing code. **All new entities use this pattern.** Old code is migrated as we touch it.

### The pattern

Three layers, each with one job:

1. **`*.repository.ts`** — all TypeORM/database calls live here. No business logic.
2. **`*.service.ts`** — business logic, uses the repository. No TypeORM imports allowed.
3. **`*.controller.ts`** — request/response shape. Calls service, never repository directly.

### Repository example (canonical)

```ts
// src/modules/tweets/tweet.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, DeepPartial, Repository } from 'typeorm';   // ← DeepPartial from typeorm, NOT mongoose
import { Tweet } from './entities/tweet.entity';

@Injectable()
export class TweetRepository {
  private readonly repository: Repository<Tweet>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Tweet);
  }

  async create(input: DeepPartial<Tweet>): Promise<Tweet> {
    const tweet = this.repository.create(input);
    return this.repository.save(tweet);
  }

  async findAll(): Promise<Tweet[]> {
    return this.repository
      .createQueryBuilder('tweet')
      .orderBy('tweet.created_at', 'DESC')
      .getMany();
  }

  async findByUserId(userId: string): Promise<Tweet[]> {
    return this.repository
      .createQueryBuilder('tweet')
      .where('tweet.userId = :userId', { userId })
      .orderBy('tweet.created_at', 'DESC')
      .getMany();
  }

  async findOneById(id: string): Promise<Tweet | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, patch: DeepPartial<Tweet>): Promise<Tweet> {
    const result = await this.repository.update(id, patch as any);
    if (result.affected === 0) {
      throw new NotFoundException(`Tweet ${id} not found`);
    }
    return (await this.findOneById(id))!;
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tweet ${id} not found`);
    }
  }
}
```

### Service example (uses the repository)

```ts
// src/modules/tweets/tweet.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { TweetRepository } from './tweet.repository';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { CurrentUserPayload } from '../../common/types/current-user';

@Injectable()
export class TweetService {
  constructor(private readonly tweetRepository: TweetRepository) {}

  async create(actor: CurrentUserPayload, dto: CreateTweetDto) {
    return this.tweetRepository.create({ ...dto, userId: actor.id });
  }

  async listByUser(actor: CurrentUserPayload, targetUserId: string) {
    if (actor.role !== 'admin' && actor.id !== targetUserId) {
      throw new ForbiddenException('Cannot view another user\'s tweets');
    }
    return this.tweetRepository.findByUserId(targetUserId);
  }
}
```

### Module wiring

```ts
// src/modules/tweets/tweet.module.ts
import { Module } from '@nestjs/common';
import { TweetController } from './tweet.controller';
import { TweetService } from './tweet.service';
import { TweetRepository } from './tweet.repository';

@Module({
  controllers: [TweetController],
  providers: [TweetService, TweetRepository],
  exports: [TweetService],   // Export service, NOT repository. Other modules use the service.
})
export class TweetModule {}
```

### Rules

- **Services never import from `typeorm` directly.** No `Repository<T>`, no `@InjectRepository`, no `QueryBuilder` calls in services. If you find a TypeORM import in a service file, you're doing it wrong.
- **Repositories never call other repositories.** If you need cross-entity logic, that's the service's job. Repositories own one entity each.
- **One repository per entity.** Don't merge two entities into a "convenience" repository.
- **Common repository methods** (use the same names everywhere): `create`, `findAll`, `findOneById`, `findBy<Field>`, `update`, `delete`. Custom queries get descriptive names: `findOverdueInvoicesForBranch(branchId)`.
- **Transactions live in the service**, using `DataSource.transaction()` or `QueryRunner`. The repository accepts an optional `EntityManager` for transactional calls:

  ```ts
  async create(input: DeepPartial<Tweet>, manager?: EntityManager): Promise<Tweet> {
    const repo = manager ? manager.getRepository(Tweet) : this.repository;
    const tweet = repo.create(input);
    return repo.save(tweet);
  }
  ```

- **Branch-scoped filtering happens in the service**, not the repository. The repository exposes `findBy<...>` methods; the service decides which branch to filter on based on the actor.

---

## 8. NestJS — Controllers

- **Thin.** A controller method is at most: extract input → call service → return result. No logic.
- **No try/catch in controllers** unless you're translating a non-HTTP error. Global filters handle the rest.
- **Always use `APP_ROUTES`** for paths. Never hand-write `'/api/v1/tweets'`.
- **Decorate every endpoint** with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)`. Public endpoints are explicit exceptions with `@Public()`.
- **Always use `@CurrentUser()`** to get the actor. Never read `req.user` directly.

```ts
@Controller(APP_ROUTES.TWEETS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  create(@CurrentUser() actor: CurrentUserPayload, @Body() dto: CreateTweetDto) {
    return this.tweetService.create(actor, dto);
  }
}
```

---

## 9. NestJS — DTOs and validation

- **Every request body has a DTO** in `dto/` with `class-validator` decorators.
- **DTOs are classes, not interfaces.** `class-validator` needs runtime classes.
- **No optional fields without explicit `@IsOptional()`.**
- **DTO field names match entity field names** unless there's a strong reason; aliasing creates bugs.

```ts
export class CreateTweetDto {
  @IsString()
  @Length(1, 280)
  content!: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
```

- **Response shape is wrapped by `TransformInterceptor`** — you return an entity, the framework wraps it in `{ success, data, message }`. Don't wrap manually.

---

## 10. Error handling

- **Throw NestJS exceptions** in services: `NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`.
- **Never `throw new Error('...')`** in domain code. It becomes a 500.
- **Custom domain exceptions** for business rules (e.g. `InsufficientStockException extends ConflictException`). Place under `common/exceptions/`.
- **Frontend services unwrap `response.data.data`** consistently. Surface `response.data.message` to the user on error via the toast system.
- **No console.log in committed code.** Use NestJS `Logger` on the backend, a real logger or remove on the frontend.

---

## 11. Real-time

- **Notifications go through `notifications.gateway.ts`.** Don't create new gateways without discussion.
- **Frontend subscribes via `getNotificationSocket()` from `services/socket.service.ts`** — memoized, single connection.
- **On socket event, invalidate the relevant TanStack Query key.** Don't manually update Redux from socket events.

---

## 12. Testing

- **Repository tests** use an in-memory or test Postgres. They cover query correctness.
- **Service tests** mock the repository and assert business logic. Fast, no DB.
- **Controller tests** are integration tests via `supertest`, hitting the full module.
- **Test naming:** `describe('TweetService.create', () => it('rejects content over 280 chars', ...))`.
- **No skipped tests in main.** A `.skip` blocks the PR.

---

## 13. File organization

```
backend/src/modules/<feature>/
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
├── <feature>.module.ts
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
├── entities/
│   └── <feature>.entity.ts
└── <feature>.service.spec.ts
```

```
frontend/src/features/<feature>/
├── components/
├── hooks/
├── pages/
├── types.ts
├── queryKeys.ts
└── api.ts
```

---

## 14. Naming

- **Files: kebab-case** for everything except React component files (PascalCase).
- **Functions/variables: camelCase.**
- **Types/Classes/Components: PascalCase.**
- **Constants: UPPER_SNAKE_CASE** only for true compile-time constants (route maps, enums-as-const values). Magic numbers inline are fine if their meaning is obvious in context.
- **Boolean variables: `isX`, `hasX`, `canX`, `shouldX`.** Never just `loaded` — is that "is loaded" or "data we loaded"?
- **Event handlers: `handleX`** in the implementation, `onX` in the prop type.

---

## 15. Commits & PRs

- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`.
- **One concern per PR.** A "fix login bug and refactor cart" PR gets bounced.
- **PR description includes:**
  - What changed and why
  - Manual test steps
  - Screenshots/recordings for UI changes
  - Any rule exceptions taken (and why)
- **No "WIP" merges to main.** Squash and clean before merge.

---

## 16. Forbidden patterns (auto-reject in code review)

- `any` (without justification comment)
- `as unknown as Foo`
- `window.confirm()` / `window.alert()` / `window.prompt()`
- `window.location.href = ...` for SPA navigation
- Raw color values (`#abc`, `text-slate-*`, etc.)
- Inline modal `<div>` instead of `<Modal>`
- Raw `z-50` / `z-[9999]` instead of the scale
- TypeORM imports in service files
- `@InjectRepository(Entity)` in new code (use the repository class instead)
- Hand-written route strings instead of `APP_ROUTES` / `FRONTEND_ROUTES`
- `console.log` in committed code
- Missing branch filter on non-admin queries
- New entities without a repository class

---

## 17. When you're stuck

- **Backend change needed?** Ask the user before modifying backend code from a frontend task.
- **Schema change needed?** Document the ALTER TABLE in the PR. `DB_SYNC=true` is dev-only.
- **A rule blocks the obvious solution?** Either the rule is wrong (propose an amendment), or your solution needs to change. Don't go around the rule silently.

End of rules.