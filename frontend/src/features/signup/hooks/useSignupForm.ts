import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { authService } from '@/services/auth.service';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';

export interface SignupErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
}

const PASSWORD_MIN = 8;

export function useSignupForm() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<SignupErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const validate = (): boolean => {
        const next: SignupErrors = {};
        if (!firstName.trim()) next.firstName = 'First name is required';
        if (!lastName.trim()) next.lastName = 'Last name is required';
        if (!email) next.email = 'Email is required';
        else if (!isValidEmail(email)) next.email = 'Enter a valid email';
        if (!password) next.password = 'Password is required';
        else if (password.length < PASSWORD_MIN)
            next.password = `At least ${PASSWORD_MIN} characters`;
        if (!confirmPassword)
            next.confirmPassword = 'Please confirm your password';
        else if (password && confirmPassword !== password)
            next.confirmPassword = "Passwords don't match";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await authService.signup({
                email,
                password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim() || undefined,
            });
            toast.success('Check your email for the verification code');
            navigate(FRONTEND_ROUTES.OTP_VERIFICATION, { state: { email } });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string | string[] }
                    | undefined;
                const msg = Array.isArray(data?.message)
                    ? data.message.join(', ')
                    : data?.message;
                toast.error(msg ?? 'Signup failed');
            } else {
                toast.error('Signup failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const clearError = (field: keyof SignupErrors) =>
        setErrors((prev) =>
            prev[field] ? { ...prev, [field]: undefined } : prev,
        );

    return {
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        setEmail,
        phone,
        setPhone,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        showPassword,
        toggleShowPassword: () => setShowPassword((s) => !s),
        errors,
        submitting,
        handleSubmit,
        clearError,
    };
}
