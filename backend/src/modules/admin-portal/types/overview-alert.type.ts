export interface OverviewAlert {
  type:
    | 'no_manager'
    | 'no_transactions'
    | 'critical_low_stock'
    | 'inactive_branch';
  branchId: string;
  branchName: string;
  message: string;
}
