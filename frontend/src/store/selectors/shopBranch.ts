import type { RootState } from '../index';

export const selectActiveBranchId = (state: RootState): string | null =>
    state.shopBranch.activeBranchId;
