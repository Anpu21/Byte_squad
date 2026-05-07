import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};
        let isValid = true;

        if (!email) {
            newErrors.email = 'Email address is required';
            isValid = false;
        } else if (isValidEmail(email) === false) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await login(email, password);
            toast.success('Successfully logged in!');
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    toast('Verify your email first', { icon: '📧' });
                    navigate(FRONTEND_ROUTES.OTP_VERIFICATION, { state: { email } });
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

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
    };

    return (
        <>
            <Logo size={36} />
            <h1 className="mt-7 text-[32px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Welcome back
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                Sign in to your Ledger Pro workspace.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div>
                    <label
                        htmlFor="login-email"
                        className="block text-xs font-medium text-text-2 mb-1.5"
                    >
                        Email address
                    </label>
                    <div
                        className={`flex items-center gap-2 h-[42px] px-3 bg-surface border rounded-md transition-colors ${
                            errors.email
                                ? 'border-danger'
                                : 'border-border-strong focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20'
                        }`}
                    >
                        <Mail size={15} className="text-text-3 flex-shrink-0" />
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="you@company.com"
                            className="flex-1 bg-transparent outline-none text-[13px] text-text-1 placeholder:text-text-3"
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1.5 text-xs text-danger font-medium">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="login-password"
                            className="text-xs font-medium text-text-2"
                        >
                            Password
                        </label>
                        <button
                            type="button"
                            className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                        >
                            Forgot?
                        </button>
                    </div>
                    <div
                        className={`flex items-center gap-2 h-[42px] px-3 bg-surface border rounded-md transition-colors ${
                            errors.password
                                ? 'border-danger'
                                : 'border-border-strong focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20'
                        }`}
                    >
                        <Lock size={15} className="text-text-3 flex-shrink-0" />
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="Enter your password"
                            className="flex-1 bg-transparent outline-none text-[13px] text-text-1 placeholder:text-text-3"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-text-3 hover:text-text-1 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1.5 text-xs text-danger font-medium">
                            {errors.password}
                        </p>
                    )}
                </div>

                <label className="flex items-center gap-2 text-xs text-text-2 cursor-pointer">
                    <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Keep me signed in for 30 days
                </label>

                <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-1">
                    {isLoading ? 'Signing in…' : 'Sign in'}
                    {!isLoading && <ArrowRight size={14} />}
                </Button>

                <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-3">or</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <Button type="button" variant="secondary" size="lg" className="w-full">
                    Continue with Google
                </Button>

                <p className="text-center text-xs text-text-2 mt-3">
                    Don&apos;t have an account?{' '}
                    <Link
                        to={FRONTEND_ROUTES.SIGNUP}
                        className="text-primary font-medium hover:opacity-80 transition-opacity"
                    >
                        Create one
                    </Link>
                </p>
            </form>
        </>
    );
}
