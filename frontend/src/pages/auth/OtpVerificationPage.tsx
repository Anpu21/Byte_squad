import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

interface LocationState {
    email?: string;
}

export default function OtpVerificationPage() {
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

    const digits = otpCode.padEnd(6, ' ').split('').slice(0, 6);

    return (
        <>
            <Logo size={36} />
            <h1 className="mt-7 text-2xl font-bold tracking-[-0.015em] text-text-1">
                Verify your email
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                We sent a 6-digit code to{' '}
                <b className="text-text-1">{email || 'your inbox'}</b>
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full h-[42px] px-3 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 placeholder:text-text-3"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Verification code
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={(e) =>
                            setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        required
                        className="sr-only"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        {digits.map((d, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-14 mono text-2xl font-semibold flex items-center justify-center rounded-md border bg-surface text-text-1 ${
                                    i === otpCode.length
                                        ? 'border-primary ring-[3px] ring-primary/20'
                                        : 'border-border-strong'
                                }`}
                            >
                                {d.trim() || ''}
                            </div>
                        ))}
                    </div>
                    <p className="caption text-xs text-text-2 mt-2">
                        Tap the field above and enter your 6-digit code.
                    </p>
                </div>

                {error && (
                    <div className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger font-medium">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    size="lg"
                    disabled={submitting || otpCode.length !== 6}
                    className="w-full"
                >
                    {submitting ? 'Verifying…' : 'Verify'}
                    {!submitting && otpCode.length === 6 && (
                        <ArrowRight size={14} />
                    )}
                </Button>

                <button
                    type="button"
                    onClick={onResend}
                    disabled={resending}
                    className="text-sm text-text-2 hover:text-text-1 transition-colors disabled:opacity-50"
                >
                    {resending ? 'Sending…' : 'Resend code'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    to={FRONTEND_ROUTES.LOGIN}
                    className="inline-flex items-center gap-1 text-xs text-text-2 hover:text-text-1 transition-colors"
                >
                    <ArrowLeft size={12} /> Back to sign in
                </Link>
            </div>
        </>
    );
}
