import { Link } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import AuthSubmitButton from '@/components/auth/AuthSubmitButton';
import OnboardingStepper from '@/components/auth/OnboardingStepper';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useSignupForm } from '@/features/signup/hooks/useSignupForm';
import { SignupNameFields } from '@/features/signup/components/SignupNameFields';
import { SignupPasswordFields } from '@/features/signup/components/SignupPasswordFields';
import { LegalFooter } from '@/features/legal';

export function SignupPage() {
    const p = useSignupForm();

    return (
        <>
            <Logo size={36} />
            <div className="mt-7">
                <OnboardingStepper currentStep={1} />
            </div>
            <h1 className="font-display text-[30px] font-semibold leading-[1.06] tracking-[-0.012em] text-text-1 sm:text-[34px]">
                Create your account
            </h1>
            <p className="mb-7 mt-2 text-sm text-text-3">
                We&apos;ll email you a verification code to finish setup.
            </p>

            <form
                onSubmit={p.handleSubmit}
                noValidate
                className="flex flex-col gap-4"
            >
                <SignupNameFields
                    firstName={p.firstName}
                    setFirstName={p.setFirstName}
                    lastName={p.lastName}
                    setLastName={p.setLastName}
                    errors={p.errors}
                    clearError={p.clearError}
                />

                <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={p.email}
                    onChange={(e) => {
                        p.setEmail(e.target.value);
                        p.clearError('email');
                    }}
                    placeholder="you@company.com"
                    error={p.errors.email}
                    sizeVariant="lg"
                />

                <Input
                    label="Phone (optional)"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={16}
                    value={p.phone}
                    onChange={(e) => {
                        p.setPhone(e.target.value);
                        p.clearError('phone');
                    }}
                    placeholder="+94 77 123 4567"
                    error={p.errors.phone}
                    sizeVariant="lg"
                />

                <SignupPasswordFields
                    password={p.password}
                    setPassword={p.setPassword}
                    confirmPassword={p.confirmPassword}
                    setConfirmPassword={p.setConfirmPassword}
                    showPassword={p.showPassword}
                    toggleShowPassword={p.toggleShowPassword}
                    errors={p.errors}
                    clearError={p.clearError}
                />

                <AuthSubmitButton
                    phase={p.submitting ? 'loading' : 'idle'}
                    idleLabel="Create account"
                    className="mt-2"
                />

                <p className="mt-2 text-center text-[13px] text-text-2">
                    Already have an account?{' '}
                    <Link
                        to={FRONTEND_ROUTES.LOGIN}
                        className="font-semibold text-primary transition-colors hover:text-accent"
                    >
                        Sign in
                    </Link>
                </p>
            </form>

            <LegalFooter variant="compact" className="mt-8" />
        </>
    );
}
