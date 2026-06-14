import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ShopCartItem {
    productId: string;
    branchId: string;
    branchName: string;
    name: string;
    /** Price of one of the chosen sellable unit (base price if no unit). */
    sellingPrice: number;
    imageUrl: string | null;
    /** Chosen sellable unit; null = the product base unit. */
    unitId: string | null;
    unitLabel: string;
    quantity: number;
}

/** Identifies a unique cart line: a product, at a branch, in a chosen unit. */
export interface ShopCartLineRef {
    productId: string;
    branchId: string;
    unitId: string | null;
}

interface ShopCartState {
    items: ShopCartItem[];
    isCartOpen: boolean;
}

const initialState: ShopCartState = {
    items: [],
    isCartOpen: false,
};

function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function isSameLine(item: ShopCartItem, ref: ShopCartLineRef): boolean {
    return (
        item.productId === ref.productId &&
        item.branchId === ref.branchId &&
        item.unitId === ref.unitId
    );
}

const shopCartSlice = createSlice({
    name: 'shopCart',
    initialState,
    reducers: {
        addToCart(
            state,
            action: PayloadAction<{
                productId: string;
                branchId: string;
                branchName: string;
                name: string;
                sellingPrice: number;
                imageUrl: string | null;
                unitId: string | null;
                unitLabel: string;
                quantity?: number;
            }>,
        ) {
            const qty = round3(action.payload.quantity ?? 1);
            if (qty <= 0) return;
            const existing = state.items.find((item) =>
                isSameLine(item, action.payload),
            );
            if (existing) {
                existing.quantity = round3(existing.quantity + qty);
            } else {
                state.items.push({
                    productId: action.payload.productId,
                    branchId: action.payload.branchId,
                    branchName: action.payload.branchName,
                    name: action.payload.name,
                    sellingPrice: action.payload.sellingPrice,
                    imageUrl: action.payload.imageUrl,
                    unitId: action.payload.unitId,
                    unitLabel: action.payload.unitLabel,
                    quantity: qty,
                });
            }
        },
        removeFromCart(state, action: PayloadAction<ShopCartLineRef>) {
            state.items = state.items.filter(
                (item) => !isSameLine(item, action.payload),
            );
        },
        setQuantity(
            state,
            action: PayloadAction<ShopCartLineRef & { quantity: number }>,
        ) {
            const item = state.items.find((i) => isSameLine(i, action.payload));
            if (item) {
                const next = round3(action.payload.quantity);
                if (next > 0) {
                    item.quantity = next;
                }
            }
        },
        openCartDrawer(state) {
            state.isCartOpen = true;
        },
        closeCartDrawer(state) {
            state.isCartOpen = false;
        },
        toggleCartDrawer(state) {
            state.isCartOpen = !state.isCartOpen;
        },
        clearShopCart(state) {
            state.items = [];
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    setQuantity,
    openCartDrawer,
    closeCartDrawer,
    toggleCartDrawer,
    clearShopCart,
} = shopCartSlice.actions;

export default shopCartSlice.reducer;
