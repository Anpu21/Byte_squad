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

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('ledgerpro_token') || null,
    isAuthenticated: !!localStorage.getItem('ledgerpro_token'),
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
        },
        clearError: (state) => {
            state.error = null;
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

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
