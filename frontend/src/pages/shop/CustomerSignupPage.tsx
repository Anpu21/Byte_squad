import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { customerAuthService } from '@/services/customer-auth.service';
import { FRONTEND_ROUTES } from '@/constants/routes';

export default function CustomerSignupPage() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await customerAuthService.signup({
                email,
                password,
                firstName,
                lastName,
                phone: phone.trim() || undefined,
            });
            toast.success('Check your email for the verification code');
            navigate(FRONTEND_ROUTES.SHOP_VERIFY_OTP, { state: { email } });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string | string[] }
                    | undefined;
                const msg = Array.isArray(data?.message)
                    ? data.message.join(', ')
                    : data?.message;
                setError(msg ?? 'Signup failed');
            } else {
                setError('Signup failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                Create account
            </h1>
            <p className="text-sm text-slate-400 mb-8">
                Sign up to track your pickup requests. We&apos;ll email you a
                verification code.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
                            First name
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
                            Last name
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

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
                        Phone (optional)
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                        At least 8 characters
                    </p>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Creating account…' : 'Create account'}
                </button>
            </form>

            <p className="mt-6 text-sm text-slate-400 text-center">
                Already have an account?{' '}
                <Link
                    to={FRONTEND_ROUTES.SHOP_LOGIN}
                    className="text-emerald-400 hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
