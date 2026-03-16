import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { loginThunk, logout as logoutAction, clearError } from '@/store/slices/authSlice';
import type { IAuthResponse } from '@/types';

export function useAuth() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, token, isAuthenticated, isLoading, error } = useSelector(
        (state: RootState) => state.auth,
    );

    const login = useCallback(
        async (email: string, password: string): Promise<IAuthResponse> => {
            return await dispatch(loginThunk({ email, password })).unwrap();
        },
        [dispatch],
    );

    const logout = useCallback(() => {
        dispatch(logoutAction());
    }, [dispatch]);

    return { user, token, isAuthenticated, isLoading, error, login, logout, clearError };
}
