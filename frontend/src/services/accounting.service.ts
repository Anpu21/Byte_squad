import api from './api';
import type { IApiResponse } from '@/types';

export interface IProfitLossData {
  period: { startDate: string; endDate: string };
  revenue: {
    totalSales: number;
    totalTransactions: number;
    totalDiscounts: number;
    totalTax: number;
    netRevenue: number;
  };
  costOfGoodsSold: {
    totalCOGS: number;
    itemsSold: number;
  };
  grossProfit: number;
  grossMargin: number;
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  netProfit: number;
  netMargin: number;
}

export interface IExpense {
  id: string;
  branchId: string;
  createdBy: string;
  creator?: { id: string; firstName: string; lastName: string };
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
  receiptUrl: string | null;
  createdAt: string;
}

export interface ICreateExpensePayload {
  branchId: string;
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
}

export const accountingService = {
  getProfitLoss: async (startDate?: string, endDate?: string): Promise<IProfitLossData> => {
    const response = await api.get<IApiResponse<IProfitLossData>>('/accounting/profit-loss', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getExpenses: async (): Promise<IExpense[]> => {
    const response = await api.get<IApiResponse<IExpense[]>>('/accounting/expenses');
    return response.data.data;
  },

  createExpense: async (payload: ICreateExpensePayload): Promise<IExpense> => {
    const response = await api.post<IApiResponse<IExpense>>('/accounting/expenses', payload);
    return response.data.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/accounting/expenses/${id}`);
  },
};
