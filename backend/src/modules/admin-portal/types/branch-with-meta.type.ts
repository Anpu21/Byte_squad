export interface BranchWithMeta {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  adminName: string | null;
  adminEmail: string | null;
  staffCount: number;
}
