import axios from 'axios';
import toast from 'react-hot-toast';
import type { IApiResponse } from '@/types/index';
import { store } from '@/store';
import { logout } from '@/store/slices/authSlice';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ledgerpro_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: unknown) => Promise.reject(error),
);

// Response interceptor: handle auth + surface unhandled server failures
api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        // 401 → log the user out (existing behavior)
        if (error.response?.status === 401) {
            store.dispatch(logout());
            return Promise.reject(error);
        }

        // Network failure (no response received) — only show if a request was made
        if (!error.response && error.request) {
            toast.error('Connection failed — please check your network');
            return Promise.reject(error);
        }

        // 5xx — server is broken; components rarely handle these gracefully
        if (error.response && error.response.status >= 500) {
            const data = error.response.data as { message?: string } | undefined;
            toast.error(data?.message || 'Server error — please try again');
        }

        // 4xx errors fall through to component-level catch handlers as before
        return Promise.reject(error);
    },
);

export default api;
export type { IApiResponse };
