import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import OnboardingStepper from '@/components/auth/OnboardingStepper';
import { useOtpVerification } from '@/features/otp-verification/hooks/useOtpVerification';
import { OtpCodeField } from '@/features/reset-password/components/OtpCodeField';

export function OtpVerificationPage() {
    const p = useOtpVerification();

    return (
        <>
            <Logo size={36} />
            <div className="mt-7">
                <OnboardingStepper currentStep={2} />
            </div>
            <h1 className="text-2xl font-bold tracking-[-0.015em] text-text-1">
                Verify your email
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                We sent a 6-digit code to{' '}
                <b className="text-text-1">{p.email || 'your inbox'}</b>
            </p>

            <form onSubmit={p.onSubmit} className="flex flex-col gap-5">
                <Input
                    label="Email"
                    type="email"
                    value={p.email}
                    onChange={(e) => p.setEmail(e.target.value)}
                    required
                    sizeVariant="lg"
                />

                <OtpCodeField
                    label="Verification code"
                    value={p.otpCode}
                    onChange={p.setOtpCode}
                    size="lg"
                    autoFocus
                    required
                    hint="Enter the 6-digit code from your email."
                />

                {p.error && (
                    <div className="px-3 py-2 rounded-md bg-danger-soft border border-danger/40 text-xs text-danger font-medium">
                        {p.error}
                    </div>
                )}

                <Button
                    type="submit"
                    size="lg"
                    disabled={p.submitting || p.otpCode.length !== 6}
                    className="w-full"
                >
                    {p.submitting ? 'Verifying…' : 'Verify'}
                    {!p.submitting && p.otpCode.length === 6 && (
                        <ArrowRight size={14} />
                    )}
                </Button>

                <button
                    type="button"
                    onClick={p.onResend}
                    disabled={p.resending}
                    className="text-sm text-text-2 hover:text-text-1 transition-colors disabled:opacity-50"
                >
                    {p.resending ? 'Sending…' : 'Resend code'}
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
