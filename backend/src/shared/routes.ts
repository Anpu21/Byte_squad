/**
 * Shared API route constants.
 * Used by both Backend (controllers) and Frontend (API calls)
 * to ensure consistency and type safety.
 */
export const API_ROUTES = {
  AUTH: {
    BASE: 'auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
} as const;
