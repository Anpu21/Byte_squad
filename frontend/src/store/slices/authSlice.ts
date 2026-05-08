import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';
import type { IUser, ILoginPayload, IAuthResponse } from '@/types';
import axios from 'axios';

interface AuthState {
    user: IUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

function getStoredUser(): IUser | null {
    try {
        const json = localStorage.getItem('ledgerpro_user');
        return json ? (JSON.parse(json) as IUser) : null;
    } catch {
        return null;
    }
}

const storedToken = localStorage.getItem('ledgerpro_token');
const storedUser = getStoredUser();

const initialState: AuthState = {
    user: storedUser,
    token: storedToken,
    isAuthenticated: !!storedToken && !!storedUser,
    isLoading: false,
    error: null,
};

export const loginThunk = createAsyncThunk<
    IAuthResponse,
    ILoginPayload,
    { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const data = await authService.login(credentials);
        localStorage.setItem('ledgerpro_token', data.accessToken);
        localStorage.setItem('ledgerpro_user', JSON.stringify(data.user));
        return data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            return rejectWithValue(
                error.response?.data?.message || 'Login failed. Please try again.'
            );
        }
        return rejectWithValue('An unexpected error occurred. Please try again.');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('ledgerpro_token');
            localStorage.removeItem('ledgerpro_user');
        },
        clearError: (state) => {
            state.error = null;
        },
        setUserBranch: (state, action: PayloadAction<string | null>) => {
            if (state.user) {
                state.user = { ...state.user, branchId: action.payload };
                localStorage.setItem(
                    'ledgerpro_user',
                    JSON.stringify(state.user),
                );
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action: PayloadAction<IAuthResponse>) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.accessToken;
                state.error = null;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.error = action.payload || 'Login failed';
            });
    },
});

export const { logout, clearError, setUserBranch } = authSlice.actions;
export default authSlice.reducer;
