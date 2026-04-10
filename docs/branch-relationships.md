# LedgerPro — Branch & Entity Relationships

## Overview

**Branch is the tenant** — it's the isolation boundary for the entire system. Think of each branch as a separate supermarket location. Every piece of data belongs to exactly one branch.

## Relationship Map

```
                        ┌─────────────┐
                        │   BRANCH    │
                        │  (tenant)   │
                        └──────┬──────┘
                               │
          ┌────────────┬───────┼────────┬──────────────┐
          │            │       │        │              │
     ┌────▼────┐ ┌─────▼──┐ ┌─▼────┐ ┌─▼──────────┐ ┌▼────────┐
     │  Users  │ │Inventory│ │Trans-│ │Ledger      │ │Expenses │
     │         │ │         │ │actions│ │Entries     │ │         │
     └─────────┘ └─────────┘ └──────┘ └────────────┘ └─────────┘
```

## Entity Relationships

### 1. Branch → Users (One-to-Many)

- Every user **must** belong to one branch (`branchId` is required, not nullable)
- A branch can have many users (admin, manager, cashier, accountant)
- **On delete: RESTRICT** — you **cannot** delete a branch if any users are assigned to it
- The `branchId` is baked into the JWT token at login, so every API call knows which branch the user belongs to

**Entity:** `backend/src/modules/users/entities/user.entity.ts`

```typescript
@Column({ type: 'uuid', name: 'branch_id' })
branchId!: string;

@ManyToOne(() => Branch, (branch) => branch.users, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'branch_id' })
branch!: Branch;
```

### 2. Branch → Inventory (One-to-Many)

- Each inventory record ties a **product** to a **branch** with a quantity
- Same product can exist in multiple branches with different stock levels
  - Example: "Coca Cola" → 50 units at Main Branch, 30 units at Downtown Branch
- Unique constraint on `[productId, branchId]` — one inventory record per product per branch
- **On delete: CASCADE** — if a branch is deleted, its inventory records are deleted too

**Entity:** `backend/src/modules/inventory/entities/inventory.entity.ts`

```typescript
@Column({ type: 'uuid', name: 'branch_id' })
branchId!: string;

@ManyToOne(() => Branch, (branch) => branch.inventoryItems, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'branch_id' })
branch!: Branch;
```

### 3. Branch → Transactions (One-to-Many)

- Every POS sale is recorded under the branch where the cashier works
- The cashier's `branchId` is automatically used when creating a transaction
- **On delete: RESTRICT** — you **cannot** delete a branch that has transactions

**Entity:** `backend/src/modules/pos/entities/transaction.entity.ts`

```typescript
@Column({ type: 'uuid', name: 'branch_id' })
branchId!: string;

@ManyToOne(() => Branch, (branch) => branch.transactions, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'branch_id' })
branch!: Branch;
```

### 4. Branch → Ledger Entries (One-to-Many)

- Every financial record (credits from sales, debits from expenses) is scoped to a branch
- When a cashier makes a sale → a CREDIT ledger entry is created for **that branch**
- When an expense is recorded → a DEBIT ledger entry is created for **that branch**
- **On delete: RESTRICT** — cannot delete a branch with ledger entries

**Entity:** `backend/src/modules/accounting/entities/ledger-entry.entity.ts`

```typescript
@Column({ type: 'uuid', name: 'branch_id' })
branchId!: string;

@ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'branch_id' })
branch!: Branch;
```

### 5. Branch → Expenses (One-to-Many)

- Every expense (rent, utilities, supplies) belongs to a branch
- The `createdBy` field links to the user who recorded it
- **On delete: RESTRICT** — cannot delete a branch with expenses

**Entity:** `backend/src/modules/accounting/entities/expense.entity.ts`

```typescript
@Column({ type: 'uuid', name: 'branch_id' })
branchId!: string;

@ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'branch_id' })
branch!: Branch;
```

## Cascade Behavior Summary

| Entity        | On Branch Delete | Reason                                      |
|---------------|------------------|---------------------------------------------|
| Users         | **RESTRICT**     | Cannot orphan user accounts                 |
| Inventory     | **CASCADE**      | Stock records are meaningless without branch |
| Transactions  | **RESTRICT**     | Financial records must be preserved          |
| Ledger Entries| **RESTRICT**     | Accounting audit trail must be preserved     |
| Expenses      | **RESTRICT**     | Financial records must be preserved          |

## Practical Implications

- A **cashier at Main Branch** can only see Main Branch inventory and can only make sales for Main Branch
- The **admin dashboard** aggregates data across all branches
- You can **never delete a branch** that has users, transactions, ledger entries, or expenses (only inventory cascades)
- The only branch you could safely delete is a **brand new empty one** with no users assigned

## Authentication & Branch Scoping

The branch isolation is enforced through the JWT token:

```
User logs in → JWT contains { sub, email, role, branchId }
                                                    ↓
                              Every API call reads branchId from token
                                                    ↓
                              Data is filtered/created for that branch only
```

### Roles and Branch Access

| Role       | Branch Scope                          |
|------------|---------------------------------------|
| ADMIN      | Can view/manage all branches          |
| MANAGER    | Operates within assigned branch       |
| ACCOUNTANT | Views financial data for own branch   |
| CASHIER    | POS operations for own branch only    |

## Database Schema (Simplified)

```sql
-- branches table
CREATE TABLE branches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR UNIQUE NOT NULL,
    address     VARCHAR NOT NULL,
    phone       VARCHAR NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- All other tables reference branches via branch_id
-- users.branch_id        → branches.id (RESTRICT)
-- inventory.branch_id    → branches.id (CASCADE)
-- transactions.branch_id → branches.id (RESTRICT)
-- ledger_entries.branch_id → branches.id (RESTRICT)
-- expenses.branch_id     → branches.id (RESTRICT)
```
