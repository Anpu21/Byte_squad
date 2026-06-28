import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/** Whether storefront "Add to cart" targets the personal cart or a group cart. */
export type ShopMode = 'personal' | 'group'

interface ShopContextState {
    mode: ShopMode
    groupId: string | null
    groupName: string | null
}

const initialState: ShopContextState = {
    mode: 'personal',
    groupId: null,
    groupName: null,
}

const shopContextSlice = createSlice({
    name: 'shopContext',
    initialState,
    reducers: {
        setGroupShopContext(
            state,
            action: PayloadAction<{ groupId: string; groupName: string }>,
        ) {
            state.mode = 'group'
            state.groupId = action.payload.groupId
            state.groupName = action.payload.groupName
        },
        clearShopContext(state) {
            state.mode = 'personal'
            state.groupId = null
            state.groupName = null
        },
    },
})

export const { setGroupShopContext, clearShopContext } =
    shopContextSlice.actions

export default shopContextSlice.reducer
