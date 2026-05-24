/**
 * Shanel-aligned row returned by `GET /pos/customers/search`. Mirrors what
 * the cashier customer picker needs to render a result and attach the
 * customer to the in-progress sale.
 *
 * `currentBalance` follows the User column convention: positive means the
 * customer owes the store, negative means the store owes the customer
 * (store credit).
 */
export interface ICustomerSearchRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentBalance: number;
}
