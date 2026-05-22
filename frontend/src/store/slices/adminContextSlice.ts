import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AdminContextState {
    selectedBranchId: string | null;
}

const initialState: AdminContextState = {
    selectedBranchId: null,
};

const adminContextSlice = createSlice({
    name: 'adminContext',
    initialState,
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

export default adminContextSlice.reducer;
