import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DiscountType } from '@shared/constants/enums';
import { generateId } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartItem {
    cartItemId: string;
    productId: string;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    discountType: DiscountType;
    lineTotal: number;
}

interface CartState {
    items: CartItem[];
    globalDiscountAmount: number;
    globalDiscountType: DiscountType;
    subtotal: number;
    total: number;
}

interface AddItemPayload {
    productId: string;
    name: string;
    barcode: string;
    unitPrice: number;
}

interface UpdateItemQuantityPayload {
    cartItemId: string;
    quantity: number;
}

interface ApplyItemDiscountPayload {
    cartItemId: string;
    discountAmount: number;
    discountType: DiscountType;
}

interface ApplyGlobalDiscountPayload {
    discountAmount: number;
    discountType: DiscountType;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateLineTotal(item: CartItem): number {
    const gross = item.unitPrice * item.quantity;
    if (item.discountType === DiscountType.PERCENTAGE) {
        return gross - gross * (item.discountAmount / 100);
    }
    if (item.discountType === DiscountType.FIXED) {
        return gross - item.discountAmount;
    }
    return gross;
}

function recalculateTotals(state: CartState): void {
    state.subtotal = state.items.reduce((sum, item) => sum + item.lineTotal, 0);

    if (state.globalDiscountType === DiscountType.PERCENTAGE) {
        state.total =
            state.subtotal - state.subtotal * (state.globalDiscountAmount / 100);
    } else if (state.globalDiscountType === DiscountType.FIXED) {
        state.total = state.subtotal - state.globalDiscountAmount;
    } else {
        state.total = state.subtotal;
    }

    state.total = Math.max(0, state.total);
}

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: CartState = {
    items: [],
    globalDiscountAmount: 0,
    globalDiscountType: DiscountType.NONE,
    subtotal: 0,
    total: 0,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addItem(state, action: PayloadAction<AddItemPayload>) {
            const existing = state.items.find(
                (item) => item.productId === action.payload.productId,
            );

            if (existing) {
                existing.quantity += 1;
                existing.lineTotal = calculateLineTotal(existing);
            } else {
                const newItem: CartItem = {
                    cartItemId: generateId(),
                    productId: action.payload.productId,
                    name: action.payload.name,
                    barcode: action.payload.barcode,
                    quantity: 1,
                    unitPrice: action.payload.unitPrice,
                    discountAmount: 0,
                    discountType: DiscountType.NONE,
                    lineTotal: action.payload.unitPrice,
                };
                state.items.push(newItem);
            }

            recalculateTotals(state);
        },

        removeItem(state, action: PayloadAction<string>) {
            state.items = state.items.filter(
                (item) => item.cartItemId !== action.payload,
            );
            recalculateTotals(state);
        },

        updateItemQuantity(
            state,
            action: PayloadAction<UpdateItemQuantityPayload>,
        ) {
            const item = state.items.find(
                (i) => i.cartItemId === action.payload.cartItemId,
            );
            if (item) {
                item.quantity = Math.max(1, action.payload.quantity);
                item.lineTotal = calculateLineTotal(item);
                recalculateTotals(state);
            }
        },

        applyItemDiscount(
            state,
            action: PayloadAction<ApplyItemDiscountPayload>,
        ) {
            const item = state.items.find(
                (i) => i.cartItemId === action.payload.cartItemId,
            );
            if (item) {
                item.discountAmount = action.payload.discountAmount;
                item.discountType = action.payload.discountType;
                item.lineTotal = calculateLineTotal(item);
                recalculateTotals(state);
            }
        },

        applyGlobalDiscount(
            state,
            action: PayloadAction<ApplyGlobalDiscountPayload>,
        ) {
            state.globalDiscountAmount = action.payload.discountAmount;
            state.globalDiscountType = action.payload.discountType;
            recalculateTotals(state);
        },

        clearCart() {
            return initialState;
        },
    },
});

export const {
    addItem,
    removeItem,
    updateItemQuantity,
    applyItemDiscount,
    applyGlobalDiscount,
    clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
