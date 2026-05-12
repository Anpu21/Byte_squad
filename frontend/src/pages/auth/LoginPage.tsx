import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import { useLoginForm } from '@/features/login/hooks/useLoginForm';
import { LoginPasswordField } from '@/features/login/components/LoginPasswordField';

export function LoginPage() {
    const p = useLoginForm();

    return (
        <>
            <Logo size={36} />
            <h1 className="mt-7 text-[32px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Welcome back
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                Sign in to your Ledger Pro workspace.
            </p>

            <form
                onSubmit={p.handleSubmit}
                noValidate
                className="flex flex-col gap-4"
            >
                <Input
                    id="login-email"
                    label="Email address"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    value={p.email}
                    onChange={(e) => {
                        p.setEmail(e.target.value);
                        p.clearError('email');
                    }}
                    placeholder="you@company.com"
                    error={p.errors.email}
                    leftIcon={<Mail size={15} />}
                    sizeVariant="lg"
                />

                <LoginPasswordField
                    value={p.password}
                    onChange={(v) => {
                        p.setPassword(v);
                        p.clearError('password');
                    }}
                    error={p.errors.password}
                    showPassword={p.showPassword}
                    onToggle={p.toggleShowPassword}
                    onForgot={p.goForgot}
                />

                <label className="flex items-center gap-2 text-xs text-text-2 cursor-pointer">
                    <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Keep me signed in for 30 days
                </label>

                <Button
                    type="submit"
                    size="lg"
                    disabled={p.isLoading}
                    className="w-full mt-1"
                >
                    {p.isLoading ? 'Signing in…' : 'Sign in'}
                    {!p.isLoading && <ArrowRight size={14} />}
                </Button>

                <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-3">or</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                >
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
