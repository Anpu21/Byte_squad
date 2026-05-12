import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';

interface LocationState {
    email?: string;
}

interface FormErrors {
    email?: string;
    otpCode?: string;
    newPassword?: string;
    confirmPassword?: string;
}

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialEmail = (location.state as LocationState | null)?.email ?? '';

    const [email, setEmail] = useState(initialEmail);
    const [otpCode, setOtpCode] = useState('');
    const [otpFocused, setOtpFocused] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const otpInputRef = useRef<HTMLInputElement>(null);

    const validate = (): boolean => {
        const next: FormErrors = {};
        if (!email) next.email = 'Email is required';
        if (!otpCode || otpCode.length !== 6) {
            next.otpCode = 'Enter the 6-digit code from your email';
        }
        if (!newPassword) {
            next.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            next.newPassword = 'Password must be at least 8 characters';
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
                const data = err.response?.data as { message?: string } | undefined;
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

    const clearError = (field: keyof FormErrors) =>
        setErrors((prev) =>
            prev[field] ? { ...prev, [field]: undefined } : prev,
        );

    const digits = otpCode.padEnd(6, ' ').split('').slice(0, 6);

    return (
        <>
            <Logo size={36} />
            <h1 className="mt-7 text-[32px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Reset your password
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                Enter the 6-digit code we sent to{' '}
                <b className="text-text-1">{email || 'your email'}</b> and choose a new password.
            </p>

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                <Input
                    id="reset-email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        clearError('email');
                    }}
                    placeholder="you@company.com"
                    error={errors.email}
                    leftIcon={<Mail size={15} />}
                    sizeVariant="lg"
                />

                <div>
                    <label
                        htmlFor="reset-otp"
                        className="block text-xs font-medium text-text-2 mb-1.5"
                    >
                        Verification code
                    </label>
                    <div
                        className="relative cursor-text"
                        onClick={() => otpInputRef.current?.focus()}
                    >
                        <input
                            ref={otpInputRef}
                            id="reset-otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={otpCode}
                            onChange={(e) => {
                                setOtpCode(
                                    e.target.value.replace(/\D/g, '').slice(0, 6),
                                );
                                clearError('otpCode');
                            }}
                            onFocus={() => setOtpFocused(true)}
                            onBlur={() => setOtpFocused(false)}
                            aria-label="6-digit verification code"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                        />
                        <div className="flex gap-2 pointer-events-none">
                            {digits.map((d, i) => {
                                const isActive =
                                    otpFocused && i === otpCode.length;
                                const isFilled = i < otpCode.length;
                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 h-12 mono text-xl font-semibold flex items-center justify-center rounded-md border bg-surface text-text-1 transition-colors ${
                                            isActive
                                                ? 'border-primary ring-[3px] ring-primary/30'
                                                : isFilled
                                                ? 'border-primary'
                                                : 'border-border-strong'
                                        }`}
                                    >
                                        {d.trim() || ''}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {errors.otpCode && (
                        <p className="mt-1.5 text-xs text-danger font-medium">
                            {errors.otpCode}
                        </p>
                    )}
                </div>

                <Input
                    id="reset-new-password"
                    label="New password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                        setNewPassword(e.target.value);
                        clearError('newPassword');
                    }}
                    placeholder="At least 8 characters"
                    error={errors.newPassword}
                    leftIcon={<Lock size={15} />}
                    sizeVariant="lg"
                    rightSlot={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-text-3 hover:text-text-1 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    }
                />

                <Input
                    id="reset-confirm-password"
                    label="Confirm new password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearError('confirmPassword');
                    }}
                    placeholder="Re-enter your new password"
                    error={errors.confirmPassword}
                    leftIcon={<Lock size={15} />}
                    sizeVariant="lg"
                />

                <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full mt-1"
                >
                    {submitting ? 'Resetting…' : 'Reset password'}
                    {!submitting && <ArrowRight size={14} />}
                </Button>

                <button
                    type="button"
                    onClick={onResend}
                    disabled={resending}
                    className="text-xs text-text-2 hover:text-text-1 transition-colors disabled:opacity-50"
                >
                    {resending ? 'Sending…' : "Didn't receive a code? Resend"}
                </button>

                <p className="text-center text-xs text-text-2 mt-1">
                    <Link
                        to={FRONTEND_ROUTES.LOGIN}
                        className="inline-flex items-center gap-1 text-text-2 hover:text-text-1 transition-colors"
                    >
                        <ArrowLeft size={12} /> Back to sign in
                    </Link>
                </p>
            </form>
        </>
    );
}
