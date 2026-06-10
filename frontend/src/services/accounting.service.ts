import api from './api'
import type {
  IAccount,
  IApiResponse,
  IBalanceSheetReport,
  IDayBookReport,
  IFiscalPeriodLock,
  ITrialBalanceReport,
  IExpense,
  IJournalVoucher,
  IJournalVoucherPayload,
  IPaginatedLedger,
  ILedgerSummary,
  ILedgerParams,
  IProfitLossData,
  ICreateExpensePayload,
  IGetExpensesParams,
  IReviewExpensePayload,
} from '@/types'

export const accountingService = {
  /** `GET /accounting/accounts` — chart of accounts. */
  listAccounts: async (): Promise<IAccount[]> => {
    const response = await api.get<IApiResponse<IAccount[]>>('/accounting/accounts')
    return response.data.data
  },

  /** `POST /accounting/journals` — balanced manual journal (admin). */
  createJournal: async (
    payload: IJournalVoucherPayload,
  ): Promise<IJournalVoucher> => {
    const response = await api.post<IApiResponse<IJournalVoucher>>(
      '/accounting/journals',
      payload,
    )
    return response.data.data
  },

  /** `GET /accounting/reports/trial-balance` */
  getTrialBalance: async (params?: {
    branchId?: string
    startDate?: string
    endDate?: string
  }): Promise<ITrialBalanceReport> => {
    const response = await api.get<IApiResponse<ITrialBalanceReport>>(
      '/accounting/reports/trial-balance',
      { params },
    )
    return response.data.data
  },

  /** `GET /accounting/reports/balance-sheet` */
  getBalanceSheet: async (params?: {
    branchId?: string
    asOf?: string
  }): Promise<IBalanceSheetReport> => {
    const response = await api.get<IApiResponse<IBalanceSheetReport>>(
      '/accounting/reports/balance-sheet',
      { params },
    )
    return response.data.data
  },

  /** `GET /accounting/reports/day-book` */
  getDayBook: async (params?: {
    branchId?: string
    date?: string
  }): Promise<IDayBookReport> => {
    const response = await api.get<IApiResponse<IDayBookReport>>(
      '/accounting/reports/day-book',
      { params },
    )
    return response.data.data
  },

  /** `GET /accounting/periods` — locked months. */
  listPeriodLocks: async (year?: number): Promise<IFiscalPeriodLock[]> => {
    const response = await api.get<IApiResponse<IFiscalPeriodLock[]>>(
      '/accounting/periods',
      { params: year ? { year } : undefined },
    )
    return response.data.data
  },

  /** `POST /accounting/periods/lock` */
  lockPeriod: async (year: number, month: number): Promise<IFiscalPeriodLock> => {
    const response = await api.post<IApiResponse<IFiscalPeriodLock>>(
      '/accounting/periods/lock',
      { year, month },
    )
    return response.data.data
  },

  /** `POST /accounting/periods/unlock` */
  unlockPeriod: async (year: number, month: number): Promise<void> => {
    await api.post('/accounting/periods/unlock', { year, month })
  },

  // Ledger
  getLedgerEntries: async (params?: ILedgerParams): Promise<IPaginatedLedger> => {
    const response = await api.get<IApiResponse<IPaginatedLedger>>('/accounting/ledger', {
      params,
    })
    return response.data.data
  },

  getLedgerSummary: async (): Promise<ILedgerSummary> => {
    const response = await api.get<IApiResponse<ILedgerSummary>>('/accounting/ledger/summary')
    return response.data.data
  },

  // Profit & Loss
  getProfitLoss: async (startDate?: string, endDate?: string): Promise<IProfitLossData> => {
    const response = await api.get<IApiResponse<IProfitLossData>>('/accounting/profit-loss', {
      params: { startDate, endDate },
    })
    return response.data.data
  },

  // Expenses
  getExpenses: async (params?: IGetExpensesParams): Promise<IExpense[]> => {
    const response = await api.get<IApiResponse<IExpense[]>>('/accounting/expenses', {
      params,
    })
    return response.data.data
  },

  createExpense: async (payload: ICreateExpensePayload): Promise<IExpense> => {
    const response = await api.post<IApiResponse<IExpense>>('/accounting/expenses', payload)
    return response.data.data
  },

  reviewExpense: async (
    id: string,
    payload: IReviewExpensePayload,
  ): Promise<IExpense> => {
    const response = await api.patch<IApiResponse<IExpense>>(
      `/accounting/expenses/${id}/review`,
      payload,
    )
    return response.data.data
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/accounting/expenses/${id}`)
  },
}
