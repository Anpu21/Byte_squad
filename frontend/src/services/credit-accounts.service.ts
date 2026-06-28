import api from './api';
import type {
  IApiResponse,
  ICreditAccount,
  ICreditAccountRow,
  ICreditAccountSearchResult,
  ICreditAccountStatement,
  ICreditAccountListParams,
  ICreditAccountSearchParams,
  ICreateCreditAccountRequestPayload,
  IApproveCreditAccountPayload,
  IRejectCreditAccountPayload,
  IUpdateCreditAccountPayload,
  IReceiveCreditAccountPaymentPayload,
  IAuthorizeOverridePayload,
  ICreditOverrideAuthorization,
} from '@/types';

/**
 * Customer store-credit ("khata") client. Walk-in buy-now-pay-later accounts,
 * distinct from User-bound receivables. Branch-scoped server-side.
 */
export const creditAccountsService = {
  /** `POST /credit-accounts` — cashier enrollment form (creates a PENDING account). */
  request: async (
    payload: ICreateCreditAccountRequestPayload,
  ): Promise<ICreditAccount> => {
    const response = await api.post<IApiResponse<ICreditAccount>>(
      '/credit-accounts',
      payload,
    );
    return response.data.data;
  },

  /** `GET /credit-accounts` — manager list with balances + ageing. */
  list: async (
    params: ICreditAccountListParams = {},
  ): Promise<ICreditAccountRow[]> => {
    const response = await api.get<IApiResponse<ICreditAccountRow[]>>(
      '/credit-accounts',
      { params },
    );
    return response.data.data;
  },

  /** `GET /credit-accounts/search` — ACTIVE accounts for the POS picker. */
  search: async (
    params: ICreditAccountSearchParams,
  ): Promise<ICreditAccountSearchResult[]> => {
    const response = await api.get<IApiResponse<ICreditAccountSearchResult[]>>(
      '/credit-accounts/search',
      { params },
    );
    return response.data.data;
  },

  /** `GET /credit-accounts/:id` */
  getById: async (id: string): Promise<ICreditAccount> => {
    const response = await api.get<IApiResponse<ICreditAccount>>(
      `/credit-accounts/${id}`,
    );
    return response.data.data;
  },

  /** `GET /credit-accounts/:id/statement` — ledger + ageing + unpaid bills. */
  statement: async (id: string): Promise<ICreditAccountStatement> => {
    const response = await api.get<IApiResponse<ICreditAccountStatement>>(
      `/credit-accounts/${id}/statement`,
    );
    return response.data.data;
  },

  /** `PATCH /credit-accounts/:id/approve` — set limit + term, move to ACTIVE. */
  approve: async (
    id: string,
    payload: IApproveCreditAccountPayload,
  ): Promise<ICreditAccount> => {
    const response = await api.patch<IApiResponse<ICreditAccount>>(
      `/credit-accounts/${id}/approve`,
      payload,
    );
    return response.data.data;
  },

  /** `PATCH /credit-accounts/:id/reject` */
  reject: async (
    id: string,
    payload: IRejectCreditAccountPayload,
  ): Promise<ICreditAccount> => {
    const response = await api.patch<IApiResponse<ICreditAccount>>(
      `/credit-accounts/${id}/reject`,
      payload,
    );
    return response.data.data;
  },

  /** `PATCH /credit-accounts/:id/suspend` — freeze an ACTIVE account. */
  suspend: async (id: string): Promise<ICreditAccount> => {
    const response = await api.patch<IApiResponse<ICreditAccount>>(
      `/credit-accounts/${id}/suspend`,
    );
    return response.data.data;
  },

  /** `PATCH /credit-accounts/:id/close` — permanently close an account. */
  close: async (id: string): Promise<ICreditAccount> => {
    const response = await api.patch<IApiResponse<ICreditAccount>>(
      `/credit-accounts/${id}/close`,
    );
    return response.data.data;
  },

  /** `PATCH /credit-accounts/:id` — edit limit/term on an ACTIVE account. */
  update: async (
    id: string,
    payload: IUpdateCreditAccountPayload,
  ): Promise<ICreditAccount> => {
    const response = await api.patch<IApiResponse<ICreditAccount>>(
      `/credit-accounts/${id}`,
      payload,
    );
    return response.data.data;
  },

  /** `POST /credit-accounts/:id/payments` — FIFO-settle outstanding bills. */
  receivePayment: async (
    id: string,
    payload: IReceiveCreditAccountPaymentPayload,
  ): Promise<ICreditAccountStatement> => {
    const response = await api.post<IApiResponse<ICreditAccountStatement>>(
      `/credit-accounts/${id}/payments`,
      payload,
    );
    return response.data.data;
  },

  /** `POST /credit-accounts/authorize-override` — manager over-limit step-up. */
  authorizeOverride: async (
    payload: IAuthorizeOverridePayload,
  ): Promise<ICreditOverrideAuthorization> => {
    const response = await api.post<IApiResponse<ICreditOverrideAuthorization>>(
      '/credit-accounts/authorize-override',
      payload,
    );
    return response.data.data;
  },
};
