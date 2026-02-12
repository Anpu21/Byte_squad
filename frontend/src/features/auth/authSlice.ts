import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, LoginCredentials, LoginResponse } from './authApi';
import { AxiosError } from 'axios';

/** Auth state shape */
interface AuthState {
    user: LoginResponse['user'] | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null') as AuthState['user'],
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
};

/**
 * Async thunk for user login.
 * Persists token + user to localStorage on success.
 */
export const loginAsync = createAsyncThunk<LoginResponse, LoginCredentials, { rejectValue: string }>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await loginUser(credentials);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            const message = axiosErr.response?.data?.message || 'Login failed. Please try again.';
            return rejectWithValue(message);
        }
    },
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.access_token;
            })
            .addCase(loginAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload ?? 'An unexpected error occurred';
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
