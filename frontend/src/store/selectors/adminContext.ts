import type { RootState } from '../index';

export const selectAdminContext = (state: RootState) => state.adminContext;
export const selectSelectedBranchId = (state: RootState) =>
    state.adminContext.selectedBranchId;
