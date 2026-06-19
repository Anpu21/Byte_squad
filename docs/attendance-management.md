# Attendance management (managers & their branch staff)

> How a **manager** manages their branch staff's attendance — **workers included** — and the architecture
> behind it. Backend: `backend/src/modules/hr/` (attendance, employees, leaves). Frontend:
> `frontend/src/features/admin-attendance/`, `admin-hr/`, `worker-dashboard/`.

## TL;DR

Managers can manage their branch's attendance **today**, end-to-end and securely. The model is
**self-service clock-in + manager bulk-mark/correct**, all **branch-scoped**. Workers appear in the
manager's roster (verified: e.g. the courier `Ravi Bandara` shows for the Main-branch manager). This doc
describes the current flow and the planned enhancements.

---

## 1. The manager flow

**Where:** Sidebar → **HR** (`nav.hr` → `/hr`, `AdminHrPage`, roles `[ADMIN, MANAGER]`) → **Attendance** tab
(`AdminAttendancePage` / `features/admin-attendance/`). Every HR route is `[ADMIN, MANAGER]`.

1. **Roster** — `AttendanceView` loads the branch's employees via `useEmployees` →
   `employees.service.list` (branch-scoped, **no role filter**, so cashiers **and workers** appear). It
   renders an attendance grid (`AttendanceRosterTable`), a month `AttendanceCalendar`, and a per-row
   `AttendanceEditModal`.
2. **Mark / correct** — the manager edits the grid and submits `POST /hr/attendance/bulk`
   (`useBulkUpsertAttendance` → `AttendanceService.bulkUpsert`). Status is one of
   `Present | Absent | Half_Day | Leave | Holiday | Weekend`. The service computes late/overtime/total-hours
   and **rejects any employee outside the manager's branch** (`resolveEmployee` → `ForbiddenException`).
3. **Self-service** — workers clock in/out from their dashboard (`WorkerShiftCard` →
   `useWorkerDashboard` → `hrService.checkInSelf`), cashiers from the POS (`PosAttendanceWidget`); both hit
   `POST /hr/attendance/check-in|check-out`. Those rows appear in the same roster the manager corrects.
4. **Leaves** — managers approve/reject branch leave requests (`employee-leaves.controller`: `APPROVE` /
   `REJECT` are `[MANAGER, ADMIN]`).

## 2. Data model & rules

`attendance` (`entities/attendance.entity.ts`) — **one row per (employee, date)** (unique constraint):

| Field | Notes |
|---|---|
| `status` | `Present \| Absent \| Half_Day \| Leave \| Holiday \| Weekend` |
| `checkInTime` / `checkOutTime` / `totalHours` | times + computed duration |
| `isLate` / `lateMinutes` | vs `employee.workingHoursStart` + branch grace window |
| `isOvertime` / `overtimeHours` | past `employee.workingHoursEnd` |
| `markedBy` | `Cashier_Self \| Manual \| Admin \| System` (provenance) |
| `createdBy` | actor user id |

- Branch is derived through `employees.branch_id` (not denormalized on the row).
- Late/overtime math lives in `attendance-math.ts`, against each employee's hours and the branch's
  `payroll_settings.lateGraceMinutes` (`PayrollSettingsService.getEffective`).

## 3. API surface & roles

| Endpoint | Roles | Notes |
|---|---|---|
| `GET /hr/attendance` | ADMIN, MANAGER | **branch-scoped**; a manager's `branchId` query param can't widen scope |
| `GET /hr/attendance/me` | all staff | self-only (worker/cashier dashboards) |
| `POST /hr/attendance/bulk` | ADMIN, MANAGER | bulk mark/correct; per-row branch ownership re-checked |
| `POST /hr/attendance/check-in` / `check-out` | CASHIER, MANAGER, ADMIN, **WORKER** | self-service, server clock |

**Security:** `list()` pins managers to their own branch regardless of the URL; `listSelf()` is self-only;
every mutation re-verifies branch ownership. Multi-tenant-safe.

## 4. Enhancements (roadmap)

The capability exists; these are polish + process wins:

- **P1 · Worker focus** — add a **role filter** (All / Workers / Cashiers …) to the attendance roster so a
  manager can isolate workers (the employees list filters by branch + search today). Plus role-neutral
  "HR / Attendance" labels (the UI is branded "Admin HR" though managers use it).
- **P1 · Proactive absence visibility** — today attendance is *pull* (open the grid). Add a daily
  "**N staff not checked in today**" manager signal (dashboard card / notification) so managers act early.
- **P2 · `AttendanceSummary`** — the entity/table is registered but **no service reads or writes it**
  (month totals are recomputed client-side in `AttendanceCalendar`). Either surface a server monthly rollup
  per employee, or remove the dead table.
- **P2 · "Marked by" transparency** — surface `markedBy` (self vs manual override) in the roster.
- **P3** — shared branch **kiosk** check-in; confirm the employee edit form exposes
  `workingHoursStart/End` so managers can set worker schedules.
