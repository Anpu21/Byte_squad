export interface SourceOption {
  branchId: string;
  branchName: string;
  isActive: boolean;
  currentQuantity: number;
  lowStockThreshold: number | null;
}
