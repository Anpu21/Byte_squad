import { PasswordRevealField } from '@/features/reset-password/components/PasswordRevealField';

interface LoginPasswordFieldProps {
    value: string;
    onChange: (v: string) => void;
    error?: string;
    showPassword: boolean;
    onToggle: () => void;
    onForgot: () => void;
}

export function LoginPasswordField({
    value,
    onChange,
    error,
    showPassword,
    onToggle,
    onForgot,
}: LoginPasswordFieldProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label
                    htmlFor="login-password"
                    className="text-xs font-medium text-text-2"
                >
                    Password
                </label>
                <button
                    type="button"
                    onClick={onForgot}
                    className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                >
                    Forgot?
                </button>
            </div>
            <PasswordRevealField
                id="login-password"
                label=""
                value={value}
                onChange={onChange}
                placeholder="Enter your password"
                error={error}
                showPassword={showPassword}
                onToggle={onToggle}
            />
        </div>
    );
}
