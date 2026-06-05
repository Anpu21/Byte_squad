import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { ShopCartItem } from '../slices/shopCartSlice';

export const selectShopCart = (state: RootState) => state.shopCart;
export const selectShopCartItems = (state: RootState) => state.shopCart.items;
export const selectShopCartIsOpen = (state: RootState) =>
    state.shopCart.isCartOpen;

export const selectShopCartTotal = createSelector(
    [selectShopCartItems],
    (items) =>
        items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0),
);

// Distinct line count (product + branch + unit). A clean badge value even when
// some lines are weighed (kg/l) with fractional quantities.
export const selectShopCartItemCount = createSelector(
    [selectShopCartItems],
    (items) => items.length,
);

export const selectShopCartIsEmpty = createSelector(
    [selectShopCartItems],
    (items) => items.length === 0,
);

export interface ShopCartBranchGroup {
    branchId: string;
    branchName: string;
    items: ShopCartItem[];
    subtotal: number;
}

// Cart lines grouped by branch — used by the cart UI and multi-branch checkout.
export const selectShopCartGroups = createSelector(
    [selectShopCartItems],
    (items): ShopCartBranchGroup[] => {
        const groups = new Map<string, ShopCartBranchGroup>();
        for (const item of items) {
            const group = groups.get(item.branchId) ?? {
                branchId: item.branchId,
                branchName: item.branchName,
                items: [],
                subtotal: 0,
            };
            group.items.push(item);
            group.subtotal += item.sellingPrice * item.quantity;
            groups.set(item.branchId, group);
        }
        return Array.from(groups.values());
    },
);
