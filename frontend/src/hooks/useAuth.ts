import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginThunk, logout as logoutAction, clearError } from '@/store/slices/authSlice';
import { selectAuth } from '@/store/selectors/auth';
import type { IAuthResponse } from '@/types';

export function useAuth() {
    const dispatch = useAppDispatch();
    const { user, token, isAuthenticated, isLoading, error } =
        useAppSelector(selectAuth);

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
