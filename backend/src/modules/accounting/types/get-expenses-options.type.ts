import { ExpenseStatus } from '@common/enums/expense-status.enum';

export interface GetExpensesOptions {
  branchId?: string;
  status?: ExpenseStatus;
  search?: string;
}
