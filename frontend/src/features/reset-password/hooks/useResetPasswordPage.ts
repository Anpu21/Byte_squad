import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface LocationState {
    email?: string;
}

export interface ResetPasswordErrors {
    email?: string;
    otpCode?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const OTP_LENGTH = 6;
const PASSWORD_MIN = 8;

export function useResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialEmail = (location.state as LocationState | null)?.email ?? '';

    const [email, setEmail] = useState(initialEmail);
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<ResetPasswordErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);

    const validate = (): boolean => {
        const next: ResetPasswordErrors = {};
        if (!email) next.email = 'Email is required';
        if (!otpCode || otpCode.length !== OTP_LENGTH) {
            next.otpCode = `Enter the ${OTP_LENGTH}-digit code from your email`;
        }
        if (!newPassword) {
            next.newPassword = 'New password is required';
        } else if (newPassword.length < PASSWORD_MIN) {
            next.newPassword = `Password must be at least ${PASSWORD_MIN} characters`;
        }
        if (newPassword && confirmPassword !== newPassword) {
            next.confirmPassword = 'Passwords do not match';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            await authService.resetPassword(email, otpCode, newPassword);
            toast.success('Password reset — sign in to continue');
            navigate(FRONTEND_ROUTES.LOGIN, { state: { email } });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Reset failed');
            } else {
                toast.error('Reset failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const onResend = async () => {
        if (!email) {
            setErrors((prev) => ({ ...prev, email: 'Enter your email first' }));
            return;
        }
        setResending(true);
        try {
            await authService.requestPasswordReset(email);
            toast.success('A new code was sent');
        } catch {
            toast.error('Could not resend code');
        } finally {
            setResending(false);
        }
    };

    const clearError = (field: keyof ResetPasswordErrors) =>
        setErrors((prev) =>
            prev[field] ? { ...prev, [field]: undefined } : prev,
        );

    return {
        email,
        setEmail,
        otpCode,
        setOtpCode,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        showPassword,
        toggleShowPassword: () => setShowPassword((v) => !v),
        errors,
        submitting,
        resending,
        onSubmit,
        onResend,
        clearError,
    };
}
