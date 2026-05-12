import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AdminContextState {
    selectedBranchId: string | null;
}

const STORAGE_KEY = 'ledgerpro_admin_context';

function loadInitial(): AdminContextState {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return { selectedBranchId: null };
        const parsed = JSON.parse(json) as { selectedBranchId?: string | null };
        const id =
            typeof parsed.selectedBranchId === 'string'
                ? parsed.selectedBranchId
                : null;
        return { selectedBranchId: id };
    } catch {
        return { selectedBranchId: null };
    }
}

const adminContextSlice = createSlice({
    name: 'adminContext',
    initialState: loadInitial(),
    reducers: {
        setSelectedBranch(state, action: PayloadAction<string | null>) {
            state.selectedBranchId = action.payload;
        },
        clearSelectedBranch(state) {
            state.selectedBranchId = null;
        },
    },
});

export const { setSelectedBranch, clearSelectedBranch } =
    adminContextSlice.actions;

export function persistAdminContext(state: AdminContextState): void {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ selectedBranchId: state.selectedBranchId }),
        );
    } catch {
        // localStorage full / disabled — silently ignore (mirrors shopCart pattern)
    }
}

export default adminContextSlice.reducer;
