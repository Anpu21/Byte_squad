import axios from 'axios';
import { API_BASE_URL, API_ROUTES } from '@/shared/routes';

/** Axios instance pre-configured with the backend base URL */
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        username: string;
        role: string;
    };
}

/**
 * Authenticates a user against the backend.
 */
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, credentials);
    return response.data;
};
