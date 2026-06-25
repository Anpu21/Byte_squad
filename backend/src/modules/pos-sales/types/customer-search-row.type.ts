/**
 * Shanel-aligned row returned by `GET /pos/customers/search`. Mirrors what
 * the cashier customer picker needs to render a result and attach a
 * customer to the in-progress sale: identity (id/name), contact details
 * (email/phone), and the running ledger balance so the cashier can see
 * whether the customer owes money or has store credit before deciding
 * whether to accept a credit-funded sale.
 *
 * `currentBalance` follows the same convention as the `User.currentBalance`
 * column: positive values mean the customer owes the store, negative means
 * the store owes the customer (i.e., store credit).
 */
export interface CustomerSearchRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentBalance: number;
}
