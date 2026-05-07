import axios from 'axios';
import toast from 'react-hot-toast';

export const CUSTOMER_TOKEN_KEY = 'ledgerpro_customer_token';
export const CUSTOMER_PROFILE_KEY = 'ledgerpro_customer';

const customerApi = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

customerApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: unknown) => Promise.reject(error),
);

customerApi.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            localStorage.removeItem(CUSTOMER_TOKEN_KEY);
            localStorage.removeItem(CUSTOMER_PROFILE_KEY);
            return Promise.reject(error);
        }

        if (!error.response && error.request) {
            toast.error('Connection failed — please check your network');
            return Promise.reject(error);
        }

        if (error.response && error.response.status >= 500) {
            const data = error.response.data as { message?: string } | undefined;
            toast.error(data?.message || 'Server error — please try again');
        }

        return Promise.reject(error);
    },
);

export default customerApi;
