import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface LocationState {
    email?: string;
}

export function useOtpVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialEmail = (location.state as LocationState | null)?.email ?? '';

    const [email, setEmail] = useState(initialEmail);
    const [otpCode, setOtpCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await authService.verifyOtp({ email, otpCode });
            toast.success('Email verified — sign in to continue');
            navigate(FRONTEND_ROUTES.LOGIN, { state: { email } });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                setError(data?.message ?? 'Verification failed');
            } else {
                setError('Verification failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const onResend = async () => {
        if (!email) {
            setError('Enter your email first');
            return;
        }
        setResending(true);
        try {
            await authService.resendOtp(email);
            toast.success('A new code was sent');
        } catch {
            toast.error('Could not resend code');
        } finally {
            setResending(false);
        }
    };

    return {
        email,
        setEmail,
        otpCode,
        setOtpCode,
        error,
        submitting,
        resending,
        onSubmit,
        onResend,
    };
}
