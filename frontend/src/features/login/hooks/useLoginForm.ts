import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface LoginErrors {
    email?: string;
    password?: string;
}

const PASSWORD_MIN = 8;

export function useLoginForm() {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<LoginErrors>({});

    const validate = (): boolean => {
        const next: LoginErrors = {};
        if (!email) next.email = 'Email address is required';
        else if (!isValidEmail(email))
            next.email = 'Please enter a valid email address';
        if (!password) next.password = 'Password is required';
        else if (password.length < PASSWORD_MIN)
            next.password = `Password must be at least ${PASSWORD_MIN} characters`;
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await login(email, password);
            toast.success('Successfully logged in!');
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    toast('Verify your email first', { icon: '📧' });
                    navigate(FRONTEND_ROUTES.OTP_VERIFICATION, {
                        state: { email },
                    });
                    return;
                }
                if (error.response?.data?.message) {
                    toast.error(String(error.response.data.message));
                    return;
                }
            }
            toast.error('Invalid email or password');
        }
    };

    const clearError = (field: keyof LoginErrors) =>
        setErrors((prev) =>
            prev[field] ? { ...prev, [field]: undefined } : prev,
        );

    return {
        email,
        setEmail,
        password,
        setPassword,
        showPassword,
        toggleShowPassword: () => setShowPassword((s) => !s),
        errors,
        clearError,
        isLoading,
        handleSubmit,
        goForgot: () => navigate(FRONTEND_ROUTES.FORGOT_PASSWORD),
    };
}
