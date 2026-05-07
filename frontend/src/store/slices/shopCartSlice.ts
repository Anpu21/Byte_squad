import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ShopCartItem {
    productId: string;
    name: string;
    sellingPrice: number;
    imageUrl: string | null;
    quantity: number;
}

interface ShopCartState {
    items: ShopCartItem[];
    branchId: string | null;
}

const STORAGE_KEY = 'ledgerpro_shop_cart';

function loadInitial(): ShopCartState {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return { items: [], branchId: null };
        const parsed = JSON.parse(json) as {
            items?: ShopCartItem[];
            branchId?: string | null;
        };
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        const branchId =
            typeof parsed.branchId === 'string' ? parsed.branchId : null;
        return { items, branchId };
    } catch {
        return { items: [], branchId: null };
    }
}

const initialState: ShopCartState = loadInitial();

const shopCartSlice = createSlice({
    name: 'shopCart',
    initialState,
    reducers: {
        addToCart(
            state,
            action: PayloadAction<{
                productId: string;
                name: string;
                sellingPrice: number;
                imageUrl: string | null;
                quantity?: number;
            }>,
        ) {
            const qty = action.payload.quantity ?? 1;
            const existing = state.items.find(
                (item) => item.productId === action.payload.productId,
            );
            if (existing) {
                existing.quantity += qty;
            } else {
                state.items.push({
                    productId: action.payload.productId,
                    name: action.payload.name,
                    sellingPrice: action.payload.sellingPrice,
                    imageUrl: action.payload.imageUrl,
                    quantity: qty,
                });
            }
        },
        removeFromCart(state, action: PayloadAction<string>) {
            state.items = state.items.filter(
                (item) => item.productId !== action.payload,
            );
        },
        setQuantity(
            state,
            action: PayloadAction<{ productId: string; quantity: number }>,
        ) {
            const item = state.items.find(
                (i) => i.productId === action.payload.productId,
            );
            if (item) {
                item.quantity = Math.max(1, Math.floor(action.payload.quantity));
            }
        },
        setBranch(state, action: PayloadAction<string | null>) {
            state.branchId = action.payload;
        },
        clearShopCart(state) {
            state.items = [];
            state.branchId = null;
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    setQuantity,
    setBranch,
    clearShopCart,
} = shopCartSlice.actions;

export function selectCartTotal(items: ShopCartItem[]): number {
    return items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
}

export function selectCartItemCount(items: ShopCartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function persistShopCart(state: ShopCartState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // localStorage full / disabled — silently ignore
    }
}

export default shopCartSlice.reducer;
