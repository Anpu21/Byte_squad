import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { LoginPage } from '@/features/login';
import { SignupPage } from '@/features/signup';
import { OtpVerificationPage } from '@/features/otp-verification';
import {
    ForgotPasswordPage,
    ResetPasswordPage,
} from '@/features/reset-password';

/** Public auth screens — wrapped by `PublicRoute` + `AuthLayout` in the aggregator. */
export const authRoutes = (
    <>
        <Route
            path={FRONTEND_ROUTES.LOGIN}
            element={<LoginPage />}
            handle={{ crumbs: ['Sign in'] }}
        />
        <Route
            path={FRONTEND_ROUTES.SIGNUP}
            element={<SignupPage />}
            handle={{ crumbs: ['Sign up'] }}
        />
        <Route
            path={FRONTEND_ROUTES.OTP_VERIFICATION}
            element={<OtpVerificationPage />}
            handle={{ crumbs: ['Verify OTP'] }}
        />
        <Route
            path={FRONTEND_ROUTES.FORGOT_PASSWORD}
            element={<ForgotPasswordPage />}
        />
        <Route
            path={FRONTEND_ROUTES.RESET_PASSWORD}
            element={<ResetPasswordPage />}
        />
    </>
);
