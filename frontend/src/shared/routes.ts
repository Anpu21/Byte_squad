/**
 * Shared API route constants.
 * Mirrored from backend to keep frontend API calls in sync.
 */
export const API_ROUTES = {
    AUTH: {
        BASE: 'auth',
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        PROFILE: '/auth/profile',
    },
} as const;

/** Base URL for the backend API (reads from .env via Vite) */
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api';
