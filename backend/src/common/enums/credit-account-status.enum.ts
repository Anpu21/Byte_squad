/**
 * Lifecycle of a customer store-credit ("khata") account.
 *
 * Stored as a plain `varchar` (not a Postgres enum) so the dev `DB_SYNC`
 * boot never has to ALTER an enum type — same approach the POS module takes
 * for `SaleStatus`/`SalePaymentStatus`.
 *
 * Flow: a cashier submits an enrollment request (`PENDING`); a branch manager
 * approves (→ `ACTIVE`, setting a credit limit + repayment term) or rejects
 * (→ `REJECTED`). An `ACTIVE` account can be `SUSPENDED` (blocks new credit,
 * balance preserved) and resumed, or `CLOSED` (terminal; history kept).
 */
export enum CreditAccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}
