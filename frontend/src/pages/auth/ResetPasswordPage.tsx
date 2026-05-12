import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import { useResetPasswordPage } from '@/features/reset-password/hooks/useResetPasswordPage';
import { OtpCodeField } from '@/features/reset-password/components/OtpCodeField';
import { PasswordRevealField } from '@/features/reset-password/components/PasswordRevealField';

export function ResetPasswordPage() {
    const p = useResetPasswordPage();

    return (
        <>
            <Logo size={36} />
            <h1 className="mt-7 text-[32px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Reset your password
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                Enter the 6-digit code we sent to{' '}
                <b className="text-text-1">{p.email || 'your email'}</b> and
                choose a new password.
            </p>

            <form
                onSubmit={p.onSubmit}
                noValidate
                className="flex flex-col gap-4"
            >
                <Input
                    id="reset-email"
                    label="Email address"
                    type="email"
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

                <OtpCodeField
                    id="reset-otp"
                    label="Verification code"
                    value={p.otpCode}
                    onChange={(next) => {
                        p.setOtpCode(next);
                        p.clearError('otpCode');
                    }}
                    error={p.errors.otpCode}
                />

                <PasswordRevealField
                    id="reset-new-password"
                    label="New password"
                    value={p.newPassword}
                    onChange={(v) => {
                        p.setNewPassword(v);
                        p.clearError('newPassword');
                    }}
                    placeholder="At least 8 characters"
                    error={p.errors.newPassword}
                    showPassword={p.showPassword}
                    onToggle={p.toggleShowPassword}
                />

                <PasswordRevealField
                    id="reset-confirm-password"
                    label="Confirm new password"
                    value={p.confirmPassword}
                    onChange={(v) => {
                        p.setConfirmPassword(v);
                        p.clearError('confirmPassword');
                    }}
                    placeholder="Re-enter your new password"
                    error={p.errors.confirmPassword}
                    showPassword={p.showPassword}
                />

                <Button
                    type="submit"
                    size="lg"
                    disabled={p.submitting}
                    className="w-full mt-1"
                >
                    {p.submitting ? 'Resetting…' : 'Reset password'}
                    {!p.submitting && <ArrowRight size={14} />}
                </Button>

                <button
                    type="button"
                    onClick={p.onResend}
                    disabled={p.resending}
                    className="text-xs text-text-2 hover:text-text-1 transition-colors disabled:opacity-50"
                >
                    {p.resending ? 'Sending…' : "Didn't receive a code? Resend"}
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
