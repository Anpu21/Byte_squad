import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { isValidEmail } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

interface FieldErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
}

const inputBase =
    'w-full h-[42px] px-3 bg-surface border rounded-md text-[13px] text-text-1 placeholder:text-text-3 outline-none transition-colors';

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const validate = (): boolean => {
        const next: FieldErrors = {};
        if (!firstName.trim()) next.firstName = 'First name is required';
        if (!lastName.trim()) next.lastName = 'Last name is required';
        if (!email) next.email = 'Email is required';
        else if (!isValidEmail(email)) next.email = 'Enter a valid email';
        if (!password) next.password = 'Password is required';
        else if (password.length < 8) next.password = 'At least 8 characters';
        if (!confirmPassword)
            next.confirmPassword = 'Please confirm your password';
        else if (password && confirmPassword !== password)
            next.confirmPassword = "Passwords don't match";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await authService.signup({
                email,
                password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim() || undefined,
            });
            toast.success('Check your email for the verification code');
            navigate(FRONTEND_ROUTES.OTP_VERIFICATION, { state: { email } });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string | string[] }
                    | undefined;
                const msg = Array.isArray(data?.message)
                    ? data.message.join(', ')
                    : data?.message;
                toast.error(msg ?? 'Signup failed');
            } else {
                toast.error('Signup failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = (hasError?: string) =>
        cn(
            inputBase,
            hasError
                ? 'border-danger focus:border-danger focus:ring-[3px] focus:ring-danger/20'
                : 'border-border-strong focus:border-primary focus:ring-[3px] focus:ring-primary/20',
        );

    return (
        <>
            <Logo size={36} />
            <h1 className="mt-7 text-[28px] font-bold tracking-[-0.02em] text-text-1 leading-tight">
                Create your account
            </h1>
            <p className="text-xs text-text-2 mt-1.5 mb-7">
                We&apos;ll email you a verification code to finish setup.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-text-2 mb-1.5">
                            First name
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Jane"
                            className={inputClass(errors.firstName)}
                        />
                        {errors.firstName && (
                            <p className="mt-1.5 text-xs text-danger font-medium">
                                {errors.firstName}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-2 mb-1.5">
                            Last name
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className={inputClass(errors.lastName)}
                        />
                        {errors.lastName && (
                            <p className="mt-1.5 text-xs text-danger font-medium">
                                {errors.lastName}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={inputClass(errors.email)}
                    />
                    {errors.email && (
                        <p className="mt-1.5 text-xs text-danger font-medium">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Phone <span className="text-text-3">(optional)</span>
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 …"
                        className={inputClass()}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Password
                    </label>
                    <div
                        className={cn(
                            'flex items-center gap-2 h-[42px] px-3 bg-surface border rounded-md transition-colors',
                            errors.password
                                ? 'border-danger'
                                : 'border-border-strong focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20',
                        )}
                    >
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="flex-1 bg-transparent outline-none text-[13px] text-text-1 placeholder:text-text-3"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="text-text-3 hover:text-text-1 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1.5 text-xs text-danger font-medium">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        Confirm password
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={inputClass(errors.confirmPassword)}
                    />
                    {errors.confirmPassword && (
                        <p className="mt-1.5 text-xs text-danger font-medium">
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full mt-2"
                >
                    {submitting ? 'Creating account…' : 'Create account'}
                </Button>

                <p className="text-center text-xs text-text-2 mt-2">
                    Already have an account?{' '}
                    <Link
                        to={FRONTEND_ROUTES.LOGIN}
                        className="text-primary font-medium hover:opacity-80 transition-opacity"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </>
    );
}
