import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { customerAuthService } from '@/services/customer-auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface LocationState {
    email?: string;
}

export default function CustomerOtpPage() {
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
            await customerAuthService.verifyOtp({ email, otpCode });
            toast.success('Email verified — you can sign in now');
            navigate(FRONTEND_ROUTES.SHOP_LOGIN, { state: { email } });
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
            await customerAuthService.resendOtp(email);
            toast.success('A new code was sent');
        } catch {
            toast.error('Could not resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                Verify your email
            </h1>
            <p className="text-sm text-slate-400 mb-8">
                Enter the 6-digit code we sent to your inbox.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
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
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-3 text-center text-lg tracking-[0.4em] font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || otpCode.length !== 6}
                    className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Verifying…' : 'Verify'}
                </button>
            </form>

            <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="mt-4 w-full text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
                {resending ? 'Sending…' : 'Resend code'}
            </button>
        </div>
    );
}
