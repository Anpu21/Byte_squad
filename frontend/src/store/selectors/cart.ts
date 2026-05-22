import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export const selectPosCart = (state: RootState) => state.cart;
export const selectPosCartItems = (state: RootState) => state.cart.items;
export const selectPosSubtotal = (state: RootState) => state.cart.subtotal;
export const selectPosTotal = (state: RootState) => state.cart.total;
export const selectPosGlobalDiscountAmount = (state: RootState) =>
    state.cart.globalDiscountAmount;
export const selectPosGlobalDiscountType = (state: RootState) =>
    state.cart.globalDiscountType;

export const selectPosItemCount = createSelector(
    [selectPosCartItems],
    (items) => items.reduce((sum, item) => sum + item.quantity, 0),
);

export const selectPosIsEmpty = createSelector(
    [selectPosCartItems],
    (items) => items.length === 0,
);
