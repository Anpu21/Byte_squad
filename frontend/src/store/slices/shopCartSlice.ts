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
    /** Product base unit (kg / l / unit) — drives fractional vs whole qty. */
    baseUnit: string;
    quantity: number;
    /**
     * "Buy by amount" lines: the firm cash the customer named (e.g. 1000 Rs of
     * bananas). When set it *is* the line total and `quantity` is the derived
     * weight; null for normal by-weight / by-count lines.
     */
    amount: number | null;
}

/**
 * Identifies a unique cart line: a product, at a branch, in a chosen unit, and
 * by its pricing mode — an "amount" line and a "weight" line for the same
 * product/unit are distinct lines that must not merge.
 */
export interface ShopCartLineRef {
    productId: string;
    branchId: string;
    unitId: string | null;
    /** True for a "buy by amount" line (item.amount != null). */
    byAmount: boolean;
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

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

function isSameLine(item: ShopCartItem, ref: ShopCartLineRef): boolean {
    return (
        item.productId === ref.productId &&
        item.branchId === ref.branchId &&
        item.unitId === ref.unitId &&
        (item.amount != null) === ref.byAmount
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
                baseUnit: string;
                quantity?: number;
                /** Firm cash for a "buy by amount" line; omit/null = by weight. */
                amount?: number | null;
            }>,
        ) {
            const qty = round3(action.payload.quantity ?? 1);
            if (qty <= 0) return;
            const amount =
                action.payload.amount != null
                    ? round2(action.payload.amount)
                    : null;
            const existing = state.items.find((item) =>
                isSameLine(item, {
                    productId: action.payload.productId,
                    branchId: action.payload.branchId,
                    unitId: action.payload.unitId,
                    byAmount: amount != null,
                }),
            );
            if (existing) {
                // Two amount adds sum both the cash and the derived weight; two
                // weight adds sum the weight (amount stays null).
                existing.quantity = round3(existing.quantity + qty);
                if (amount != null) {
                    existing.amount = round2((existing.amount ?? 0) + amount);
                }
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
                    baseUnit: action.payload.baseUnit,
                    quantity: qty,
                    amount,
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
