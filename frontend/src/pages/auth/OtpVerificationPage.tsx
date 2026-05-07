import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';

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

    return (
        <>
            <div className="mb-7">
                <h2 className="text-[22px] font-semibold text-slate-100 leading-tight">
                    Verify your email
                </h2>
                <p className="text-sm text-slate-400 mt-1.5">
                    Enter the 6-digit code we sent to your inbox
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 placeholder:text-slate-600 transition-all duration-200"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
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
                        placeholder="123456"
                        className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-mono tracking-[0.5em] text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 placeholder:text-slate-700 transition-all duration-200"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || otpCode.length !== 6}
                    className={`w-full h-[50px] rounded-xl border-none text-slate-900 text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-300 bg-white shadow-[0_6px_24px_rgba(255,255,255,0.1)] ${
                        submitting || otpCode.length !== 6
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:-translate-y-0.5'
                    }`}
                >
                    {submitting ? 'Verifying…' : 'Verify'}
                </button>
            </form>

            <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="mt-5 w-full text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 bg-transparent border-none cursor-pointer py-2"
            >
                {resending ? 'Sending…' : 'Resend code'}
            </button>

            <div className="mt-6 text-center">
                <Link
                    to={FRONTEND_ROUTES.LOGIN}
                    className="text-[13px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                    ← Back to sign in
                </Link>
            </div>
        </>
    );
}
