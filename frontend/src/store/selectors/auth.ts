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
