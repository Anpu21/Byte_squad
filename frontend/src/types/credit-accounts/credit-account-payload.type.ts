import type { CreditAccountStatus } from './credit-account.type';

/** Body for `POST /credit-accounts` — the cashier enrollment form. */
export interface ICreateCreditAccountRequestPayload {
  holderName: string;
  phone: string;
  nic?: string;
  address?: string;
  requestedCreditLimit?: number;
  note?: string;
  /** Required for admins; managers/cashiers are pinned to their own branch. */
  branchId?: string;
}

/** Body for `PATCH /credit-accounts/:id/approve` — set limit + term, → ACTIVE. */
export interface IApproveCreditAccountPayload {
  creditLimit: number;
  creditTermDays: number;
  approvalNote?: string;
}

/** Body for `PATCH /credit-accounts/:id/reject`. */
export interface IRejectCreditAccountPayload {
  rejectionReason: string;
}

/** Body for `PATCH /credit-accounts/:id` — edit limit/term on an ACTIVE account. */
export interface IUpdateCreditAccountPayload {
  creditLimit?: number;
  creditTermDays?: number;
}

export type CreditAccountPaymentMethod = 'Cash' | 'Card' | 'Bank';

/** Body for `POST /credit-accounts/:id/payments`. */
export interface IReceiveCreditAccountPaymentPayload {
  amount: number;
  method: CreditAccountPaymentMethod;
  notes?: string;
}

/** Body for `POST /credit-accounts/authorize-override` — manager step-up. */
export interface IAuthorizeOverridePayload {
  email: string;
  password: string;
  creditAccountId: string;
  amount: number;
}

/** Result of a successful over-limit authorization (short-lived token). */
export interface ICreditOverrideAuthorization {
  token: string;
  authorizedBy: string;
  expiresInSeconds: number;
}

/** Query params for `GET /credit-accounts`. */
export interface ICreditAccountListParams {
  status?: CreditAccountStatus;
  branchId?: string;
  search?: string;
}

/** Query params for `GET /credit-accounts/search`. */
export interface ICreditAccountSearchParams {
  q: string;
  branchId?: string;
}
