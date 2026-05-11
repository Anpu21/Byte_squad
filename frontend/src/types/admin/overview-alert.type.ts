export interface IOverviewAlert {
  type: 'no_admin' | 'no_transactions' | 'critical_low_stock' | 'inactive_branch'
  branchId: string
  branchName: string
  message: string
}
