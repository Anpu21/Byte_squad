import { createSelector } from '@reduxjs/toolkit';
import { UserRole } from '@/constants/enums';
import type { RootState } from '../index';

export const selectAuth = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
    state.auth.isAuthenticated;
export const selectAuthIsLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectUserRole = (state: RootState) =>
    state.auth.user?.role ?? null;
export const selectUserBranchId = (state: RootState) =>
    state.auth.user?.branchId ?? null;
export const selectAuthToken = (state: RootState) => state.auth.token;

// Named role flags so call sites don't inline `user?.role === UserRole.X`
// (rules.md §6 — derived state belongs in memoised selectors).
export const selectIsAdmin = createSelector(
    [selectUserRole],
    (role) => role === UserRole.ADMIN,
);
export const selectIsManager = createSelector(
    [selectUserRole],
    (role) => role === UserRole.MANAGER,
);
export const selectIsCashier = createSelector(
    [selectUserRole],
    (role) => role === UserRole.CASHIER,
);
export const selectIsCustomer = createSelector(
    [selectUserRole],
    (role) => role === UserRole.CUSTOMER,
);
