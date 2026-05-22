import api from './api'
import type {
  IApiResponse,
  IExpense,
  IPaginatedLedger,
  ILedgerSummary,
  ILedgerParams,
  IProfitLossData,
  ICreateExpensePayload,
  IGetExpensesParams,
  IReviewExpensePayload,
} from '@/types'

export const accountingService = {
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
