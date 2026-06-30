import { Link } from 'react-router-dom';
import { LuArrowRight as ArrowRight, LuMail as Mail } from 'react-icons/lu';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import AuthSubmitButton from '@/components/auth/AuthSubmitButton';
import { useLoginForm } from '@/features/login/hooks/useLoginForm';
import { LoginPasswordField } from '@/features/login/components/LoginPasswordField';

/** Brand-coloured Google "G" (decorative). */
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.24 1.4-1 2.6-2.1 3.4l3.4 2.6c2-1.8 3.1-4.5 3.1-7.7 0-.7-.06-1.4-.18-2z"
            />
            <path
                fill="#34A853"
                d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-.9.6-2.1 1-3.3 1-2.6 0-4.8-1.7-5.6-4.1l-3.5 2.7C4.3 19.8 7.9 22 12 22z"
            />
            <path
                fill="#4A90D9"
                d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L2.9 7.4C2.3 8.8 2 10.4 2 12s.3 3.2 1 4.6z"
            />
            <path
                fill="#FBBC05"
                d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 7.9 2 4.3 4.2 2.9 7.4l3.5 2.7C7.2 7.7 9.4 6 12 6z"
            />
        </svg>
    );
}

export function LoginPage() {
    const p = useLoginForm();

    return (
        <>
            <Logo size={36} />

            <h1 className="mt-8 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.012em] text-text-1 sm:text-[38px]">
                Welcome back
            </h1>
            <p className="mb-7 mt-2.5 text-sm text-text-3">
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

                {/* Remember me — styled checkbox (decorative, as before). */}
                <label className="flex cursor-pointer select-none items-center gap-3">
                    <span className="relative inline-grid place-items-center">
                        <input
                            type="checkbox"
                            defaultChecked
                            className="peer sr-only"
                        />
                        <span className="col-start-1 row-start-1 h-[18px] w-[18px] rounded-[5px] border border-border-strong bg-surface-2 transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-[3px] peer-focus-visible:ring-accent/30" />
                        <svg
                            className="col-start-1 row-start-1 text-text-inv opacity-0 transition-opacity peer-checked:opacity-100"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="m5 12.5 4.5 4.5L19 7" />
                        </svg>
                    </span>
                    <span className="text-[13px] text-text-2">
                        Keep me signed in for 30 days
                    </span>
                </label>

                <AuthSubmitButton
                    phase={p.isLoading ? 'loading' : 'idle'}
                    idleLabel="Sign in"
                    idleIcon={<ArrowRight size={16} />}
                    className="mt-1"
                />

                <div className="my-2 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-text-3">or</span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                >
                    <GoogleIcon />
                    Continue with Google
                </Button>

                <p className="mt-3 text-center text-[13px] text-text-2">
                    Don&apos;t have an account?{' '}
                    <Link
                        to={FRONTEND_ROUTES.SIGNUP}
                        className="font-semibold text-primary transition-colors hover:text-accent"
                    >
                        Create one
                    </Link>
                </p>
            </form>
        </>
    );
}
