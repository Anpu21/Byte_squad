import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import {
    customerLoginThunk,
    customerLogout as logoutAction,
    clearCustomerAuthError,
} from '@/store/slices/customerAuthSlice';
import type { ICustomerAuthResponse } from '@/types';

export function useCustomerAuth() {
    const dispatch = useDispatch<AppDispatch>();
    const { customer, token, isAuthenticated, isLoading, error } = useSelector(
        (state: RootState) => state.customerAuth,
    );

    const login = useCallback(
        async (
            email: string,
            password: string,
        ): Promise<ICustomerAuthResponse> => {
            return await dispatch(customerLoginThunk({ email, password })).unwrap();
        },
        [dispatch],
    );

    const logout = useCallback(() => {
        dispatch(logoutAction());
    }, [dispatch]);

    const clearError = useCallback(() => {
        dispatch(clearCustomerAuthError());
    }, [dispatch]);

    return { customer, token, isAuthenticated, isLoading, error, login, logout, clearError };
}
