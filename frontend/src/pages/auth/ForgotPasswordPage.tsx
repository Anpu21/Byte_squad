import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        if (!email) {
            setEmailError('Email address is required');
            return false;
        }
        if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError(null);
        return true;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            await authService.requestPasswordReset(email);
            toast.success('If an account exists, a reset code was sent');
            navigate(FRONTEND_ROUTES.RESET_PASSWORD, { state: { email } });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as { message?: string } | undefined;
                toast.error(data?.message ?? 'Could not send reset code');
            } else {
                toast.error('Could not send reset code');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Logo size={36} />
            <h1 className="mt-7 text-[32px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Forgot your password?
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                Enter your email and we&apos;ll send you a code to reset it.
            </p>

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                <Input
                    id="forgot-email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                    }}
                    placeholder="you@company.com"
                    autoFocus
                    error={emailError ?? undefined}
                    leftIcon={<Mail size={15} />}
                    sizeVariant="lg"
                />

                <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full mt-1"
                >
                    {submitting ? 'Sending…' : 'Send reset code'}
                    {!submitting && <ArrowRight size={14} />}
                </Button>

                <p className="text-center text-xs text-text-2 mt-3">
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
