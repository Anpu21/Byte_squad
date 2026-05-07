import {
    createSlice,
    createAsyncThunk,
    type PayloadAction,
} from '@reduxjs/toolkit';
import axios from 'axios';
import { customerAuthService } from '@/services/customer-auth.service';
import {
    CUSTOMER_TOKEN_KEY,
    CUSTOMER_PROFILE_KEY,
} from '@/services/customer-api';
import type {
    ICustomer,
    ICustomerAuthResponse,
    ICustomerLoginPayload,
} from '@/types';

interface CustomerAuthState {
    customer: ICustomer | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

function getStoredCustomer(): ICustomer | null {
    try {
        const json = localStorage.getItem(CUSTOMER_PROFILE_KEY);
        return json ? (JSON.parse(json) as ICustomer) : null;
    } catch {
        return null;
    }
}

const storedToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
const storedCustomer = getStoredCustomer();

const initialState: CustomerAuthState = {
    customer: storedCustomer,
    token: storedToken,
    isAuthenticated: !!storedToken && !!storedCustomer,
    isLoading: false,
    error: null,
};

export const customerLoginThunk = createAsyncThunk<
    ICustomerAuthResponse,
    ICustomerLoginPayload,
    { rejectValue: string }
>('customerAuth/login', async (credentials, { rejectWithValue }) => {
    try {
        const data = await customerAuthService.login(credentials);
        localStorage.setItem(CUSTOMER_TOKEN_KEY, data.accessToken);
        localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(data.customer));
        return data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            return rejectWithValue(
                (error.response?.data as { message?: string } | undefined)
                    ?.message ?? 'Login failed. Please try again.',
            );
        }
        return rejectWithValue('An unexpected error occurred. Please try again.');
    }
});

const customerAuthSlice = createSlice({
    name: 'customerAuth',
    initialState,
    reducers: {
        customerLogout: (state) => {
            state.customer = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem(CUSTOMER_TOKEN_KEY);
            localStorage.removeItem(CUSTOMER_PROFILE_KEY);
        },
        clearCustomerAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(customerLoginThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(
                customerLoginThunk.fulfilled,
                (state, action: PayloadAction<ICustomerAuthResponse>) => {
                    state.isLoading = false;
                    state.isAuthenticated = true;
                    state.customer = action.payload.customer;
                    state.token = action.payload.accessToken;
                    state.error = null;
                },
            )
            .addCase(customerLoginThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.customer = null;
                state.token = null;
                state.error = action.payload ?? 'Login failed';
            });
    },
});

export const { customerLogout, clearCustomerAuthError } =
    customerAuthSlice.actions;
export default customerAuthSlice.reducer;
