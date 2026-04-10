# LedgerPro — Super Admin Feature Specification

## Overview

The **SUPER_ADMIN** is the business owner — the person who owns and oversees all supermarket branches. They manage the business at a strategic level, not the daily operations. There is only **one** SUPER_ADMIN in the system, created as a default seeded user.

---

## Role Hierarchy

```
SUPER_ADMIN (1 system-wide — business owner)
│
│  Manages the business
│   ├─ Branches
│   ├─ Admin accounts
│   └─ High-level analytics
│
└── ADMIN (1 per branch — branch manager)
    │
    │  Manages daily operations
    │   ├─ Staff (manager, accountant, cashier)
    │   ├─ Inventory
    │   ├─ POS
    │   └─ Accounting
    │
    ├── MANAGER (branch operations)
    ├── ACCOUNTANT (branch finances)
    └── CASHIER (POS only)
```

---

## Permission Matrix

| Action                        | SUPER_ADMIN | ADMIN | MANAGER | ACCOUNTANT | CASHIER |
|-------------------------------|:-----------:|:-----:|:-------:|:----------:|:-------:|
| Create / manage branches      |      Y      |       |         |            |         |
| Create / manage admins        |      Y      |       |         |            |         |
| View all-branch dashboard     |      Y      |       |         |            |         |
| Branch comparison analytics   |      Y      |       |         |            |         |
| View all users (read-only)    |      Y      |       |         |            |         |
| Audit log                     |      Y      |       |         |            |         |
| System settings               |      Y      |       |         |            |         |
| Create staff (non-admin)      |             |   Y   |         |            |         |
| Manage inventory              |             |   Y   |    Y    |            |         |
| POS operations                |             |   Y   |    Y    |            |    Y    |
| View ledger / P&L             |             |   Y   |         |     Y      |         |
| Manage expenses               |             |   Y   |         |     Y      |         |
| View branch dashboard         |             |   Y   |    Y    |     Y      |    Y    |

---

## Super Admin Features

### 1. Branch Management (Must Have)

The core feature — create and manage all supermarket locations.

**Capabilities:**
- Create new branches (name, address, phone)
- Edit branch details (name, address, phone)
- Activate / deactivate branches (soft disable — does not delete data)
- Delete empty branches (only if no users, transactions, or financial records exist)
- See branch status at a glance (active/inactive, admin assigned or not)

**UI — Branch Management Page:**

| Column       | Description                                    |
|--------------|------------------------------------------------|
| Branch Name  | Name of the location                           |
| Address      | Physical address                               |
| Phone        | Contact number                                 |
| Status       | Active / Inactive badge                        |
| Admin        | Assigned admin name or "No admin" warning badge |
| Staff Count  | Total users in the branch                      |
| Actions      | Edit, Toggle Active, Delete                    |

**Business Rules:**
- A branch can exist without an admin temporarily (show warning badge)
- Cannot delete a branch that has users, transactions, ledger entries, or expenses
- Deactivating a branch does not affect existing data, but prevents new operations
- Branch name must be unique

---

### 2. Admin Management (Must Have)

Create and manage one ADMIN account per branch.

**Capabilities:**
- Create admin accounts (email, name, password)
- Assign admin to a branch
- Reassign admin to a different branch
- Deactivate / delete admin accounts
- Reset admin passwords
- View all admins and their branch assignments

**UI — Admin Management Page:**

| Column       | Description                       |
|--------------|-----------------------------------|
| Name         | Admin's full name                 |
| Email        | Login email                       |
| Branch       | Assigned branch name              |
| Status       | Active / Inactive                 |
| Last Login   | When they last logged in          |
| Actions      | Edit, Reset Password, Delete      |

**Business Rules:**
- Only SUPER_ADMIN can create ADMIN accounts
- ADMIN cannot create other ADMINs
- One admin per branch is recommended but not enforced
- Deleting an admin does not affect branch data

---

### 3. Overview Dashboard (Must Have)

The big picture — all branches at a glance. This is the SUPER_ADMIN's home page.

**Summary Cards (top row):**

| Card              | Value                        | Sub text              |
|-------------------|------------------------------|-----------------------|
| Total Revenue     | Sum across all branches      | "Today" or date range |
| Total Transactions| Count across all branches    | Today / this week     |
| Total Branches    | Active branches count        | "X active, Y inactive"|
| Total Staff       | All users count              | Across all branches   |

**Branch Performance Table:**

| Column           | Description                                   |
|------------------|-----------------------------------------------|
| Branch Name      | Location name                                 |
| Today's Sales    | Revenue for today                             |
| Transactions     | Transaction count today                       |
| Staff Count      | Number of users                               |
| Active Products  | Products with stock > 0                       |
| Low Stock Items  | Products below threshold                      |
| Status           | Active / Inactive badge                       |

**Alerts Section:**
- Branches with critical low stock items
- Branches with no admin assigned
- Branches with no transactions today (potential issue)
- Inactive branches

---

### 4. Branch Comparison Analytics (Nice to Have)

Side-by-side comparison of branch performance.

**Capabilities:**
- Select 2 or more branches to compare
- Compare revenue over a date range
- Compare expense ratios (expenses / revenue)
- Compare product performance (which branch sells more of which product)
- Compare staff efficiency (revenue per staff member)

**Visualizations:**
- Bar chart: Revenue by branch
- Bar chart: Expenses by branch
- Table: Top 5 products per branch with quantities sold
- Metric cards: Average transaction value per branch

**Use Case:**
- Owner wants to know: "Should I invest more in Downtown Branch or open a new location?"
- Owner wants to know: "Which branch has the highest expense-to-revenue ratio?"

---

### 5. All Users Overview (Nice to Have)

Read-only view of every user across all branches.

**Capabilities:**
- See all users grouped by branch
- Filter by role, branch, or status
- Search by name or email
- View user details (role, branch, created date, last login, verified status)
- Cannot edit — editing is done by the branch admin

**UI — Users Overview Page:**

| Column       | Description                       |
|--------------|-----------------------------------|
| Name         | Full name                         |
| Email        | Login email                       |
| Role         | ADMIN / MANAGER / ACCOUNTANT / CASHIER |
| Branch       | Assigned branch name              |
| Status       | Verified / Unverified             |
| Created      | Account creation date             |

**Use Case:**
- Owner wants to know total headcount
- Owner wants to see if any users haven't verified their accounts
- Owner wants a birds-eye view without micromanaging

---

### 6. Audit Log (Future)

Track who did what and when across the entire system.

**Logged Events:**
- User created / deleted / role changed
- Branch created / edited / deactivated
- Product created / deleted / price changed
- Transaction voided or returned
- Large transactions above a threshold
- Expense created / deleted
- Password resets

**UI — Audit Log Page:**

| Column       | Description                                    |
|--------------|------------------------------------------------|
| Timestamp    | When the action happened                       |
| User         | Who performed the action                       |
| Branch       | Which branch it happened in                    |
| Action       | What was done (Created, Updated, Deleted, etc) |
| Entity       | What was affected (User, Product, Transaction) |
| Details      | Specific changes (old value → new value)       |

**Filters:**
- Date range
- Branch
- User
- Action type
- Entity type

**Use Case:**
- Owner suspects fraud: "Who voided that LKR 50,000 transaction?"
- Owner wants accountability: "What did the new admin change in their first week?"
- Compliance: audit trail for financial records

---

### 7. System Settings (Future)

Global configuration that applies to all branches.

**Settings Categories:**

#### Business Information
- Business name (appears on receipts, reports)
- Business logo
- Business registration number
- Contact email / phone

#### Financial Settings
- Default tax rate (e.g., 8%)
- Currency (LKR)
- Currency format (symbol position, decimal places)
- Financial year start month

#### Inventory Settings
- Default low stock threshold
- Enable/disable barcode requirement
- Allow negative stock (sell even if qty = 0)

#### POS Settings
- Receipt header text
- Receipt footer text
- Enable/disable cash change calculator
- Default payment method

#### Security Settings
- Password minimum length
- Session timeout duration
- Max login attempts before lockout
- Require OTP for new accounts

---

### 8. Notifications & Alerts (Future)

Super admin gets system-wide notifications.

**Alert Types:**

| Alert                         | Trigger                                         |
|-------------------------------|--------------------------------------------------|
| Critical Low Stock            | Any branch has product with qty < 5              |
| No Transactions               | A branch has 0 transactions for a full day       |
| Large Void/Return             | Transaction void or return above LKR 10,000      |
| New Branch Created            | Confirmation after branch creation               |
| Admin Account Created         | Confirmation after admin creation                |
| Branch Deactivated            | When a branch is set to inactive                 |
| Daily Summary                 | End-of-day summary of all branches (email)       |
| Weekly Report                 | Weekly performance summary (email)               |

---

## Super Admin Navigation (Sidebar)

```
📊  Dashboard           → All-branch overview with performance cards
🏢  Branches            → Create / edit / manage branches
👤  Admin Management    → Create / assign admins to branches
👥  All Users           → Read-only view of all staff (Nice to Have)
📈  Branch Comparison   → Side-by-side analytics (Nice to Have)
📋  Audit Log           → Who did what, when (Future)
⚙️  System Settings     → Global configuration (Future)
🔔  Notifications
👤  Profile
```

---

## Seeded Users

| Email                      | Password     | Role        | Branch           |
|----------------------------|-------------|-------------|------------------|
| superadmin@ledgerpro.com   | Super@123   | SUPER_ADMIN | Main Branch      |
| admin@ledgerpro.com        | Admin@123   | ADMIN       | Main Branch      |
| admin2@ledgerpro.com       | Admin@123   | ADMIN       | Downtown Branch  |
| manager@ledgerpro.com      | Manager@123 | MANAGER     | Downtown Branch  |
| accountant@ledgerpro.com   | Account@123 | ACCOUNTANT  | Main Branch      |
| cashier@ledgerpro.com      | Cashier@123 | CASHIER     | Main Branch      |
| cashier2@ledgerpro.com     | Cashier@123 | CASHIER     | Downtown Branch  |

---

## Implementation Priority

| Priority    | Feature                    | Effort   | Status  |
|-------------|----------------------------|----------|---------|
| Must Have   | Branch Management          | Medium   | Planned |
| Must Have   | Admin Management           | Medium   | Planned |
| Must Have   | Overview Dashboard         | High     | Planned |
| Nice to Have| Branch Comparison          | Medium   | Planned |
| Nice to Have| All Users Overview         | Low      | Planned |
| Future      | Audit Log                  | High     | Planned |
| Future      | System Settings            | Medium   | Planned |
| Future      | Advanced Notifications     | Medium   | Planned |

---

## What Does NOT Change

- ADMIN role behavior (manages their branch — inventory, POS, accounting, staff)
- MANAGER, ACCOUNTANT, CASHIER roles (no changes)
- All existing pages and functionality remain the same
- Data isolation per branch remains the same
- JWT token structure (just adds SUPER_ADMIN as a new role value)

---

## Technical Changes Required

### Backend
1. Add `SUPER_ADMIN` to `UserRole` enum
2. Update role guards to recognize `SUPER_ADMIN`
3. Add new endpoints for super admin dashboard (cross-branch aggregation)
4. Update seed service with new users
5. Restrict branch/admin management endpoints to `SUPER_ADMIN` only
6. Update user creation — ADMIN can only create MANAGER/ACCOUNTANT/CASHIER

### Frontend
1. Add `SUPER_ADMIN` to frontend `UserRole` enum
2. Update sidebar navigation for role-based menu items
3. Create Super Admin Dashboard page
4. Create Branch Management page
5. Create Admin Management page
6. Update AppRouter with new routes and role guards
7. Update SmartRedirect for SUPER_ADMIN default landing page
