import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import OnboardingStepper from '@/components/auth/OnboardingStepper';
import PasswordStrength from '@/components/auth/PasswordStrength';

interface FieldErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
}

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const validate = (): boolean => {
        const next: FieldErrors = {};
        if (!firstName.trim()) next.firstName = 'First name is required';
        if (!lastName.trim()) next.lastName = 'Last name is required';
        if (!email) next.email = 'Email is required';
        else if (!isValidEmail(email)) next.email = 'Enter a valid email';
        if (!password) next.password = 'Password is required';
        else if (password.length < 8) next.password = 'At least 8 characters';
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

    const clearError = (field: keyof FieldErrors) =>
        setErrors((prev) =>
            prev[field] ? { ...prev, [field]: undefined } : prev,
        );

    return (
        <>
            <Logo size={36} />
            <div className="mt-7">
                <OnboardingStepper currentStep={1} />
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Create your account
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                We&apos;ll email you a verification code to finish setup.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="First name"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => {
                            setFirstName(e.target.value);
                            clearError('firstName');
                        }}
                        placeholder="Jane"
                        error={errors.firstName}
                        sizeVariant="lg"
                    />
                    <Input
                        label="Last name"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => {
                            setLastName(e.target.value);
                            clearError('lastName');
                        }}
                        placeholder="Doe"
                        error={errors.lastName}
                        sizeVariant="lg"
                    />
                </div>

                <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        clearError('email');
                    }}
                    placeholder="you@company.com"
                    error={errors.email}
                    sizeVariant="lg"
                />

                <Input
                    label="Phone (optional)"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 …"
                    sizeVariant="lg"
                />

                <div>
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            clearError('password');
                        }}
                        placeholder="At least 8 characters"
                        error={errors.password}
                        sizeVariant="lg"
                        rightSlot={
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="text-text-3 hover:text-text-1 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        }
                    />
                    {password && <PasswordStrength password={password} />}
                </div>

                <Input
                    label="Confirm password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearError('confirmPassword');
                    }}
                    placeholder="Re-enter your password"
                    error={errors.confirmPassword}
                    sizeVariant="lg"
                />

                <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full mt-2"
                >
                    {submitting ? 'Creating account…' : 'Create account'}
                </Button>

                <p className="text-center text-xs text-text-2 mt-2">
                    Already have an account?{' '}
                    <Link
                        to={FRONTEND_ROUTES.LOGIN}
                        className="text-primary font-medium hover:opacity-80 transition-opacity"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </>
    );
}
