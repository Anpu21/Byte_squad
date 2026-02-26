import axios from 'axios';
import type { IApiResponse } from '@/types/index';

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

// Response interceptor: handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            localStorage.removeItem('ledgerpro_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

export default api;
export type { IApiResponse };
