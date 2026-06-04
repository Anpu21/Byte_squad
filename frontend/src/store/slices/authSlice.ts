import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { authService } from '../../services/auth.service';
import type { IUser, ILoginPayload, IAuthResponse } from '@/types';

interface AuthState {
    user: IUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthRejectValue {
    message: string;
    status?: number;
    code?: string;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

export const loginThunk = createAsyncThunk<
    IAuthResponse,
    ILoginPayload,
    { rejectValue: AuthRejectValue }
>('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        return await authService.login(credentials);
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            return rejectWithValue(
                {
                    message:
                        error.code === 'ECONNABORTED'
                            ? 'Login timed out. Check that the backend server is running.'
                            : error.response?.data?.message ||
                              (!error.response
                                  ? 'Cannot reach the backend server. Check that it is running and try again.'
                                  : 'Login failed. Please try again.'),
                    status: error.response?.status,
                    code: error.code,
                },
            );
        }
        return rejectWithValue({
            message: 'An unexpected error occurred. Please try again.',
        });
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
        },
        clearError: (state) => {
            state.error = null;
        },
        setUserBranch: (state, action: PayloadAction<string | null>) => {
            if (state.user) {
                state.user = { ...state.user, branchId: action.payload };
            }
        },
        setUser: (state, action: PayloadAction<Partial<IUser>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
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
                state.error = action.payload?.message || 'Login failed';
            });
    },
});

export const { logout, clearError, setUserBranch, setUser } = authSlice.actions;
export default authSlice.reducer;
