import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ShopBranchState {
    /** The branch whose catalogue the customer is currently browsing. */
    activeBranchId: string | null;
}

const initialState: ShopBranchState = {
    activeBranchId: null,
};

const shopBranchSlice = createSlice({
    name: 'shopBranch',
    initialState,
    reducers: {
        setActiveBranch(state, action: PayloadAction<string | null>) {
            state.activeBranchId = action.payload;
        },
    },
});

export const { setActiveBranch } = shopBranchSlice.actions;

export default shopBranchSlice.reducer;
