import customerApi from './customer-api';
import type {
    IApiResponse,
    ICustomer,
    ICustomerAuthResponse,
    ICustomerSignupPayload,
    ICustomerLoginPayload,
    ICustomerVerifyOtpPayload,
} from '@/types';

export const customerAuthService = {
    signup: async (
        payload: ICustomerSignupPayload,
    ): Promise<{ customerId: string }> => {
        const response = await customerApi.post<
            IApiResponse<{ customerId: string }>
        >('/customer-auth/signup', payload);
        return response.data.data;
    },

    verifyOtp: async (
        payload: ICustomerVerifyOtpPayload,
    ): Promise<{ message: string }> => {
        const response = await customerApi.post<
            IApiResponse<{ message: string }>
        >('/customer-auth/verify-otp', payload);
        return response.data.data;
    },

    resendOtp: async (email: string): Promise<{ message: string }> => {
        const response = await customerApi.post<
            IApiResponse<{ message: string }>
        >('/customer-auth/resend-otp', { email });
        return response.data.data;
    },

    login: async (
        payload: ICustomerLoginPayload,
    ): Promise<ICustomerAuthResponse> => {
        const response = await customerApi.post<
            IApiResponse<ICustomerAuthResponse>
        >('/customer-auth/login', payload);
        return response.data.data;
    },

    me: async (): Promise<ICustomer> => {
        const response = await customerApi.get<IApiResponse<ICustomer>>(
            '/customers/me',
        );
        return response.data.data;
    },
};
