import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export const selectShopCart = (state: RootState) => state.shopCart;
export const selectShopCartItems = (state: RootState) => state.shopCart.items;
export const selectShopCartIsOpen = (state: RootState) =>
    state.shopCart.isCartOpen;

export const selectShopCartTotal = createSelector(
    [selectShopCartItems],
    (items) =>
        items.reduce(
            (sum, item) => sum + item.sellingPrice * item.quantity,
            0,
        ),
);

export const selectShopCartItemCount = createSelector(
    [selectShopCartItems],
    (items) => items.reduce((sum, item) => sum + item.quantity, 0),
);

export const selectShopCartIsEmpty = createSelector(
    [selectShopCartItems],
    (items) => items.length === 0,
);
