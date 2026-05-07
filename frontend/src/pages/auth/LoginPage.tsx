import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';

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
        
        // Stop submission if validation fails
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

    // Helper to clear errors when user starts typing
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
            <div className="mb-7">
                <h2 className="text-[22px] font-semibold text-slate-100 leading-tight">
                    Welcome back
                </h2>
                <p className="text-sm text-slate-400 mt-1.5">
                    Sign in to your account to continue
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                {/* Email field */}
                <div className="mb-5.5">
                    <label
                        htmlFor="login-email"
                        className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]"
                    >
                        Email Address
                    </label>
                    <div className="relative">
                        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${errors.email ? 'text-rose-400' : 'text-slate-500'}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="4" width="20" height="16" rx="3" />
                                <path d="m2 7 10 6 10-6" />
                            </svg>
                        </div>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="you@company.com"
                            aria-invalid={!!errors.email}
                            className={`w-full h-12 pl-10.5 pr-4 bg-white/5 border rounded-xl text-slate-200 text-sm outline-none transition-all duration-200 placeholder:text-slate-600 ${
                                errors.email 
                                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-[3px] focus:ring-rose-500/20' 
                                    : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20'
                            }`}
                        />
                    </div>
                    {/* Inline Error Display */}
                    {errors.email && (
                        <p className="mt-2 text-[12px] text-rose-400 flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Password field */}
                <div className="mb-7 mt-5">
                    <div className="flex items-center justify-between mb-2">
                        <label
                            htmlFor="login-password"
                            className="text-[11px] font-semibold text-slate-400 uppercase tracking-[1px]"
                        >
                            Password
                        </label>
                        <button
                            type="button"
                            className="text-xs font-medium text-slate-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="relative">
                        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${errors.password ? 'text-rose-400' : 'text-slate-500'}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="11" width="18" height="11" rx="3" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="Enter your password"
                            aria-invalid={!!errors.password}
                            className={`w-full h-12 pl-10.5 pr-12 bg-white/5 border rounded-xl text-slate-200 text-sm outline-none transition-all duration-200 placeholder:text-slate-600 ${
                                errors.password 
                                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-[3px] focus:ring-rose-500/20' 
                                    : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 flex items-center bg-transparent border-none cursor-pointer"
                        >
                             {showPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            )}
                        </button>
                    </div>
                    {/* Inline Error Display */}
                    {errors.password && (
                        <p className="mt-2 text-[12px] text-rose-400 flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {errors.password}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-[50px] rounded-xl border-none text-slate-900 text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-300 bg-white shadow-[0_6px_24px_rgba(255,255,255,0.1)] ${
                        isLoading 
                            ? 'opacity-75 cursor-not-allowed' 
                            : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_36px_rgba(255,255,255,0.2)]'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin text-slate-900">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" fill="none" />
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                            </svg>
                            Signing in…
                        </>
                    ) : (
                        <>
                            Sign In
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </>
                    )}
                </button>
            </form>

            <div className="flex items-center gap-3.5 my-7">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[11px] text-slate-500 uppercase tracking-[1.5px] font-semibold">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <p className="text-center text-[13px] text-slate-400">
                Don&apos;t have an account?{' '}
                <Link
                    to={FRONTEND_ROUTES.SIGNUP}
                    className="text-slate-200 font-semibold hover:text-white transition-colors"
                >
                    Create one
                </Link>
            </p>
        </>
    );
}