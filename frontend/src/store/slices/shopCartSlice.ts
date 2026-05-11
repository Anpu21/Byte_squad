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
    isCartOpen: boolean;
}

const STORAGE_KEY = 'ledgerpro_shop_cart';

function loadInitial(): ShopCartState {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return { items: [], isCartOpen: false };
        const parsed = JSON.parse(json) as { items?: ShopCartItem[] };
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        return { items, isCartOpen: false };
    } catch {
        return { items: [], isCartOpen: false };
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

export function selectCartTotal(items: ShopCartItem[]): number {
    return items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
}

export function selectCartItemCount(items: ShopCartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function persistShopCart(state: ShopCartState): void {
    try {
        const { items } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
    } catch {
        // localStorage full / disabled — silently ignore
    }
}

export default shopCartSlice.reducer;
