/**
 * Minimal branch roster entry used to populate the Branch Comparison picker.
 * Exposes only id + name + active flag (no management fields), so a MANAGER can
 * see which other branches exist to compare against without the multi-tenant
 * scoping that restricts the full `/branches` management list to their own branch.
 */
export interface BranchAnalyticsBranchOption {
  id: string;
  name: string;
  isActive: boolean;
}
