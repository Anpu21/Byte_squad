import { useState, useCallback } from 'react';
import type { IUser, IAuthResponse } from '@/types/index';
import api from '@/services/api';

interface AuthState {
    user: IUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface UseAuthReturn extends AuthState {
    login: (email: string, password: string) => Promise<IAuthResponse>;
    logout: () => void;
}

const TOKEN_KEY = 'ledgerpro_token';
const USER_KEY = 'ledgerpro_user';

function getStoredAuth(): { user: IUser | null; token: string | null } {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (!token || !userJson) {
        return { user: null, token: null };
    }

    try {
        const user = JSON.parse(userJson) as IUser;
        return { user, token };
    } catch {
        return { user: null, token: null };
    }
}

export function useAuth(): UseAuthReturn {
    const stored = getStoredAuth();

    const [authState, setAuthState] = useState<AuthState>({
        user: stored.user,
        token: stored.token,
        isAuthenticated: Boolean(stored.token),
        isLoading: false,
    });

    const login = useCallback(
        async (email: string, password: string): Promise<IAuthResponse> => {
            setAuthState((prev) => ({ ...prev, isLoading: true }));

            const response = await api.post<{ data: IAuthResponse }>('/auth/login', {
                email,
                password,
            });

            const authResponse = response.data.data;

            localStorage.setItem(TOKEN_KEY, authResponse.accessToken);
            localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));

            setAuthState({
                user: authResponse.user,
                token: authResponse.accessToken,
                isAuthenticated: true,
                isLoading: false,
            });

            return authResponse;
        },
        [],
    );

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    }, []);

    return {
        ...authState,
        login,
        logout,
    };
}
