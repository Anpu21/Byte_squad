import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { authService } from '@/services/auth.service';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';

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

    return (
        <>
            <div className="mb-7">
                <h2 className="text-[22px] font-semibold text-slate-100 leading-tight">
                    Create your account
                </h2>
                <p className="text-sm text-slate-400 mt-1.5">
                    We&apos;ll email you a verification code to finish setup
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                            First name
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Jane"
                            className={`w-full h-12 px-4 bg-white/5 border rounded-xl text-slate-200 text-sm outline-none transition-all duration-200 placeholder:text-slate-600 ${
                                errors.firstName
                                    ? 'border-rose-500/50 focus:border-rose-500'
                                    : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20'
                            }`}
                        />
                        {errors.firstName && (
                            <p className="mt-2 text-[12px] text-rose-400">
                                {errors.firstName}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                            Last name
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className={`w-full h-12 px-4 bg-white/5 border rounded-xl text-slate-200 text-sm outline-none transition-all duration-200 placeholder:text-slate-600 ${
                                errors.lastName
                                    ? 'border-rose-500/50 focus:border-rose-500'
                                    : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20'
                            }`}
                        />
                        {errors.lastName && (
                            <p className="mt-2 text-[12px] text-rose-400">
                                {errors.lastName}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mb-5">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={`w-full h-12 px-4 bg-white/5 border rounded-xl text-slate-200 text-sm outline-none transition-all duration-200 placeholder:text-slate-600 ${
                            errors.email
                                ? 'border-rose-500/50 focus:border-rose-500'
                                : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20'
                        }`}
                    />
                    {errors.email && (
                        <p className="mt-2 text-[12px] text-rose-400">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="mb-5">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                        Phone (optional)
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 …"
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 placeholder:text-slate-600 transition-all duration-200"
                    />
                </div>

                <div className="mb-5">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className={`w-full h-12 pl-4 pr-12 bg-white/5 border rounded-xl text-slate-200 text-sm outline-none transition-all duration-200 placeholder:text-slate-600 ${
                                errors.password
                                    ? 'border-rose-500/50 focus:border-rose-500'
                                    : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                        >
                            {showPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-2 text-[12px] text-rose-400">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="mb-7">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                        Confirm password
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`w-full h-12 px-4 bg-white/5 border rounded-xl text-slate-200 text-sm outline-none transition-all duration-200 placeholder:text-slate-600 ${
                            errors.confirmPassword
                                ? 'border-rose-500/50 focus:border-rose-500'
                                : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20'
                        }`}
                    />
                    {errors.confirmPassword && (
                        <p className="mt-2 text-[12px] text-rose-400">
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full h-[50px] rounded-xl border-none text-slate-900 text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-300 bg-white shadow-[0_6px_24px_rgba(255,255,255,0.1)] ${
                        submitting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
                    }`}
                >
                    {submitting ? 'Creating account…' : 'Create account'}
                </button>
            </form>

            <div className="flex items-center gap-3.5 my-7">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[11px] text-slate-500 uppercase tracking-[1.5px] font-semibold">
                    or
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <p className="text-center text-[13px] text-slate-400">
                Already have an account?{' '}
                <Link
                    to={FRONTEND_ROUTES.LOGIN}
                    className="text-slate-200 font-semibold hover:text-white transition-colors"
                >
                    Sign in
                </Link>
            </p>
        </>
    );
}
