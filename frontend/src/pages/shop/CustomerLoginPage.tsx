import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface LocationState {
    from?: string;
}

export default function CustomerLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading } = useCustomerAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            const from = (location.state as LocationState | null)?.from;
            navigate(from ?? FRONTEND_ROUTES.SHOP);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 403) {
                toast('Verify your email first', { icon: '📧' });
                navigate(FRONTEND_ROUTES.SHOP_VERIFY_OTP, { state: { email } });
                return;
            }
            const message =
                err instanceof Error ? err.message : 'Login failed';
            setError(message);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                Sign in
            </h1>
            <p className="text-sm text-slate-400 mb-8">
                Welcome back. Sign in to view your past pickup requests.
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
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <p className="mt-6 text-sm text-slate-400 text-center">
                New here?{' '}
                <Link
                    to={FRONTEND_ROUTES.SHOP_SIGNUP}
                    className="text-emerald-400 hover:underline"
                >
                    Create an account
                </Link>
            </p>
            <p className="mt-2 text-sm text-slate-500 text-center">
                Or just{' '}
                <Link
                    to={FRONTEND_ROUTES.SHOP}
                    className="text-slate-300 hover:underline"
                >
                    keep browsing as a guest
                </Link>
            </p>
        </div>
    );
}
