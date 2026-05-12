import { Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import PasswordStrength from '@/components/auth/PasswordStrength';
import type { SignupErrors } from '../hooks/useSignupForm';

interface SignupPasswordFieldsProps {
    password: string;
    setPassword: (v: string) => void;
    confirmPassword: string;
    setConfirmPassword: (v: string) => void;
    showPassword: boolean;
    toggleShowPassword: () => void;
    errors: SignupErrors;
    clearError: (field: keyof SignupErrors) => void;
}

export function SignupPasswordFields({
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword,
    errors,
    clearError,
}: SignupPasswordFieldsProps) {
    return (
        <>
            <div>
                <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        clearError('password');
                    }}
                    placeholder="At least 8 characters"
                    error={errors.password}
                    sizeVariant="lg"
                    rightSlot={
                        <button
                            type="button"
                            onClick={toggleShowPassword}
                            className="text-text-3 hover:text-text-1 transition-colors"
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={15} />
                            ) : (
                                <Eye size={15} />
                            )}
                        </button>
                    }
                />
                {password && <PasswordStrength password={password} />}
            </div>

            <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError('confirmPassword');
                }}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                sizeVariant="lg"
            />
        </>
    );
}
