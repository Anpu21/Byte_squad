# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** backend (LedgerPro — multi-branch supermarket POS / inventory / accounting)
- **Scope:** Backend API, full codebase, port 5000 (`/api/v1`)
- **Date:** 2026-06-05
- **Prepared by:** TestSprite AI Team (executed via Claude Code)
- **Test plan:** `testsprite_tests/testsprite_backend_test_plan.json` (10 cases)
- **Headline:** 0/10 cases passed — but **every failure is a test-harness / API-contract / sandbox issue, not a confirmed application defect.** Two systemic causes broke the shared login helper before any business or security assertion could run (see §4). The intended RBAC / branch-scoping / idempotency / validation checks were therefore **not actually evaluated** and remain open (tracked in `tmp/code_summary.yaml` → `known_limitations`).

---

## 2️⃣ Requirement Validation Summary

### Requirement: Authentication (login, signup, OTP)
- **Description:** `POST /api/v1/auth/login`, `/auth/signup`, `/auth/verify-otp`.

#### Test TC001 — test_auth_login_with_valid_and_invalid_credentials
- **Test Code:** [TC001_test_auth_login_with_valid_and_invalid_credentials.py](./TC001_test_auth_login_with_valid_and_invalid_credentials.py)
- **Test Error:** `AssertionError: Expected 200 OK for valid credentials, got 201`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/eb4b0961-1d22-4495-9d1e-ac30aa2f4544
- **Status:** ❌ Failed
- **Severity:** MEDIUM (API contract)
- **Analysis / Findings:** **Not an app failure — login actually succeeded and returned valid tokens.** The endpoint returns **201 Created** because `POST /auth/login` (`src/modules/auth/auth.controller.ts:27`) has no `@HttpCode(200)`; NestJS defaults POST to 201. The test (correctly, by REST convention) expected 200. Fix: add `@HttpCode(HttpStatus.OK)` to `login` (a login is not a resource creation). This single mismatch is the root cause of most other failures below, since the generated auth helper asserts a 200.

#### Test TC002 — test_auth_signup_and_otp_verification_flow
- **Test Code:** [TC002_test_auth_signup_and_otp_verification_flow.py](./TC002_test_auth_signup_and_otp_verification_flow.py)
- **Test Error:** `ModuleNotFoundError: No module named 'pytest'`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/1cce65eb-23ed-4c56-ad7c-b48ee9d3fad6
- **Status:** ❌ Failed
- **Severity:** LOW (test environment)
- **Analysis / Findings:** Pure **execution-sandbox** issue — TestSprite's runner (`/var/task/handler.py`) lacked the `pytest` module, so the test never ran. No signal about the signup/OTP flow itself.

### Requirement: User Profile & Customer Branch Selection
- **Description:** `GET/PATCH /api/v1/users/profile`, `PATCH /api/v1/users/me/branch` (customer-only).

#### Test TC003 — test_users_profile_retrieval_and_update
- **Test Code:** [TC003_test_users_profile_retrieval_and_update.py](./TC003_test_users_profile_retrieval_and_update.py)
- **Test Error:** `AssertionError: Login failed: {"success":true,"data":{"accessToken":"…","user":{…"email":"admin@ledgerpro.com"…}},"message":"Success"}`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/14a7f1ab-2f03-4321-ba63-aa6e5d9ab4ac
- **Status:** ❌ Failed
- **Severity:** LOW (test contract)
- **Analysis / Findings:** **Login clearly succeeded** (the error body shows `success:true` + a valid token for `admin@ledgerpro.com`). The helper flagged it only because of the **201 status** (TC001) and/or the **`{success,data,message}` response envelope** produced by the global `TransformInterceptor` (`src/common/interceptors/transform.interceptor.ts`). The generated test read the token at the wrong path. Profile behavior itself was never exercised.

#### Test TC004 — test_users_customer_branch_selection_and_role_restriction
- **Test Code:** [TC004_test_users_customer_branch_selection_and_role_restriction.py](./TC004_test_users_customer_branch_selection_and_role_restriction.py)
- **Test Error:** `AssertionError: Branches list should be present and non-empty`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/eaf8a13e-972f-4d9a-861e-8d75cfec32fa
- **Status:** ❌ Failed
- **Severity:** LOW (test contract)
- **Analysis / Findings:** `GET /branches` returns the array under `data` (the global envelope); the test looked for a top-level array and saw "empty." The seed creates 3 branches, so data exists. The intended check — **non-customer roles must get 403 on `/users/me/branch`** — was not reached. Needs re-run after the test parses `response.data`.

### Requirement: Branch Management
- **Description:** Branch CRUD (ADMIN) + manager performance.

#### Test TC005 — test_branches_crud_and_manager_performance_view
- **Test Code:** [TC005_test_branches_crud_and_manager_performance_view.py](./TC005_test_branches_crud_and_manager_performance_view.py)
- **Test Error:** `AssertionError: Login failed with status 201`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/b8d3fe1c-3875-4d3d-b66f-4f78ca7632c2
- **Status:** ❌ Failed
- **Severity:** MEDIUM (API contract, same as TC001)
- **Analysis / Findings:** Same **201-vs-200** login cause. Branch CRUD / RBAC was not evaluated.

### Requirement: Product Catalog
- **Description:** Product CRUD + image upload (ADMIN/MANAGER).

#### Test TC006 — test_products_catalog_crud_and_image_upload
- **Test Code:** [TC006_test_products_catalog_crud_and_image_upload.py](./TC006_test_products_catalog_crud_and_image_upload.py)
- **Test Error:** `ModuleNotFoundError: No module named 'PIL'`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/81f12085-7ee3-41a6-bfae-5531c64da3f6
- **Status:** ❌ Failed
- **Severity:** LOW (test environment)
- **Analysis / Findings:** **Sandbox** missing `Pillow` (PIL) for the image-upload step. Product behavior not exercised.

### Requirement: POS Checkout (idempotency + multi-tender)
- **Description:** `POST /api/v1/pos/transactions` (legacy, X-Idempotency-Key) and `/pos/sales` (multi-tender).

#### Test TC007 — test_pos_checkout_idempotency_and_validation
- **Test Code:** [TC007_test_pos_checkout_idempotency_and_validation.py](./TC007_test_pos_checkout_idempotency_and_validation.py)
- **Test Error:** `AssertionError: Login failed for cashier@ledgerpro.com`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/2df0d627-4ef8-4932-9c38-c8afddb4f242
- **Status:** ❌ Failed
- **Severity:** MEDIUM (blocks key idempotency/security check)
- **Analysis / Findings:** Cashier auth failed at the helper — consistent with the **201 status** handling (the account `cashier@ledgerpro.com / Cashier@123` is seeded). The headline checks — **duplicate `X-Idempotency-Key` → 409** and rejecting both `customerUserId` + `loyaltyCustomerId` — were not reached. High-value to re-run.

### Requirement: Stock Transfers (state machine + branch enforcement)
- **Description:** request → approve → ship → receive with branch guards.

#### Test TC008 — test_stock_transfers_state_machine_and_branch_enforcement
- **Test Code:** [TC008_test_stock_transfers_state_machine_and_branch_enforcement.py](./TC008_test_stock_transfers_state_machine_and_branch_enforcement.py)
- **Test Error:** `AttributeError: 'str' object has no attribute 'get'`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/2a665e59-b29f-4609-8505-127544cff0fc
- **Status:** ❌ Failed
- **Severity:** LOW (generated-code bug)
- **Analysis / Findings:** **TestSprite codegen bug** — the generated test treated a string response as a dict (`.get`), again because the `{success,data,message}` envelope shape wasn't anticipated. The transfer state-machine / 403 branch-enforcement checks did not run.

### Requirement: Customer Orders (lifecycle + transitions)
- **Description:** create → cancel/accept/reject → fulfill.

#### Test TC009 — test_customer_orders_creation_and_status_transitions
- **Test Code:** [TC009_test_customer_orders_creation_and_status_transitions.py](./TC009_test_customer_orders_creation_and_status_transitions.py)
- **Test Error:** `IndentationError: unexpected indent` (an LLM explanation paragraph was written into the `.py` file as code)
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/8fb2c549-5c3c-4829-a94c-bf0b40d136f4
- **Status:** ❌ Failed
- **Severity:** LOW (generated-code bug)
- **Analysis / Findings:** **TestSprite auto-repair corrupted the test file** — it injected prose ("…is invalid in the test, so no patch needed here…") into the source, producing a syntax error. Not an app signal.

### Requirement: Notifications (list + mark-read ownership)
- **Description:** list/get/mark-read; ownership gap probe.

#### Test TC010 — test_notifications_list_view_and_mark_read
- **Test Code:** [TC010_test_notifications_list_view_and_mark_read.py](./TC010_test_notifications_list_view_and_mark_read.py)
- **Test Error:** `AssertionError: Login failed: 401 {"success":false,"message":"Invalid credentials","statusCode":401}`
- **Test Visualization:** https://www.testsprite.com/dashboard/mcp/tests/b5a018e4-253e-4bfe-b6e9-581b65a382c4/6f2b64e3-2f67-42c2-8734-4dcf350ffeae
- **Status:** ❌ Failed
- **Severity:** LOW (test data)
- **Analysis / Findings:** A **genuine 401** — the credentials the generated test used did not match a seeded account (wrong password or a self-created user under the envelope mismatch). The **notification mark-read IDOR** probe (the security item of interest) was therefore not validated. This gap is documented statically in `known_limitations` and should be the priority of the re-run.

---

## 3️⃣ Coverage & Matching Metrics

- **0.00% of tests passed** (0 / 10) — see §4; failures are harness/contract/sandbox, not confirmed defects.

| Requirement | Total | ✅ Passed | ❌ Failed | Dominant failure cause |
|---|---|---|---|---|
| Authentication | 2 | 0 | 2 | login returns 201 (TC001); sandbox no `pytest` (TC002) |
| User Profile & Branch Select | 2 | 0 | 2 | response envelope / 201 helper (TC003, TC004) |
| Branch Management | 1 | 0 | 1 | login 201 (TC005) |
| Product Catalog | 1 | 0 | 1 | sandbox no `PIL` (TC006) |
| POS Checkout | 1 | 0 | 1 | cashier login (201 helper) (TC007) |
| Stock Transfers | 1 | 0 | 1 | generated-code bug / envelope (TC008) |
| Customer Orders | 1 | 0 | 1 | generated-code corruption (TC009) |
| Notifications | 1 | 0 | 1 | genuine 401 / test credentials (TC010) |
| **Total** | **10** | **0** | **10** | — |

**Failure taxonomy:** API-contract (login 201): TC001, TC003, TC005, TC007 · response-envelope: TC003, TC004, TC008 · execution-sandbox deps: TC002, TC006 · TestSprite codegen bug: TC008, TC009 · test-credential 401: TC010. **App-confirmed defects: 0.**

---

## 4️⃣ Key Gaps / Risks

**Why every test failed (and why it is mostly NOT the application):**

1. **`POST /auth/login` returns `201`, not `200`** — `src/modules/auth/auth.controller.ts:27` lacks `@HttpCode(HttpStatus.OK)`. TestSprite's shared login helper asserts 200, so auth "failed" in TC001/TC003/TC005/TC007 even though login worked and returned valid JWTs. **This one line cascaded into the majority of failures.** Recommended fix: add `@HttpCode(HttpStatus.OK)` to `login` (and review `signup`/OTP for intended codes). Low-risk; the SPA tolerates 201 today, but strict API clients/tests do not.
2. **Global response envelope `{ success, data, message }`** (`src/common/interceptors/transform.interceptor.ts`) — generated tests read top-level fields (`accessToken`, branch arrays) and missed `data.*`. Re-runs must be told the contract: tokens at `data.accessToken`, lists at `data`.
3. **TestSprite execution sandbox missing deps** — `pytest` (TC002) and `Pillow/PIL` (TC006) absent in the runner; those cases never executed.
4. **TestSprite codegen defects** — TC008 (`'str'.get`) and TC009 (prose written into the `.py`, `IndentationError`); regenerate those cases.
5. **TC010 used credentials the server rejected (real 401)** — supply known seeded creds so the notification path runs.

**Open RISKS that this run did NOT clear (auth broke before assertions ran) — verify on re-run:** these come from the static analysis in `testsprite_tests/tmp/code_summary.yaml → known_limitations` and remain unproven either way:
- 🔴 **Notification IDOR** — `PATCH /notifications/:id/read` has no ownership check (`notifications.controller.ts:41`). TC010 was meant to probe this and could not.
- 🔴 **Cross-branch inventory read** — `GET /inventory/branch/:branchId` trusts the URL branch with no `actor.branchId` check; `/inventory/low-stock` is global. (Not in this 10-case plan — add to next plan.)
- 🟠 **POS unit integrity** — `/pos/sales` accepts fractional qty for `unit`-base products (TC007 target, unverified).
- 🟠 **Idempotency 409** on duplicate `X-Idempotency-Key` (TC007 target, unverified).
- 🟠 **Missing `@Max` on pagination `limit`** across inventory/returns/stock-adjustments/transfers/shop (DoS).
- 🟠 **Auth hardening** — no `MaxLength` on passwords (bcrypt DoS), no visible OTP rate-limiting, `isFirstLogin` not enforced.
- 🟠 **Loyalty point adjust** check-then-write race + no per-request cap; **CSV injection** in `/hr/payroll/csv`.

**Recommended next steps (to convert this into real pass/fail signal):**
1. Add `@HttpCode(HttpStatus.OK)` to `auth.login` (and verify other non-201 POSTs), then re-run TestSprite.
2. Re-bootstrap/regen telling TestSprite the responses are enveloped under `data` and pass seeded creds (admin/manager/cashier/customer @ledgerpro.com).
3. Ensure the runner has `pytest` + `Pillow`, and regenerate TC008/TC009.
4. Extend the plan with explicit negative/security cases for the cross-branch inventory IDOR, notification IDOR, pagination caps, and fractional-unit POS — the items most likely to be real.

> **Bottom line:** 0/10 reflects test-harness friction (a 201 login + an envelope the generated suite didn't model) plus sandbox/codegen issues — **not** a 0%-functional API (login, branches, and the seed all responded correctly in the error payloads). The genuine, code-level findings are catalogued in `known_limitations`; the dynamic suite needs the contract fixes above before it can confirm or clear them.
