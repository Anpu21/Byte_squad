import { Eye, EyeOff, Lock } from 'lucide-react';
import Input from '@/components/ui/Input';

interface PasswordRevealFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    showPassword: boolean;
    onToggle?: () => void;
}

export function PasswordRevealField({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    showPassword,
    onToggle,
}: PasswordRevealFieldProps) {
    return (
        <Input
            id={id}
            label={label}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            error={error}
            leftIcon={<Lock size={15} />}
            sizeVariant="lg"
            rightSlot={
                onToggle ? (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="text-text-3 hover:text-text-1 transition-colors"
                        aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                        }
                    >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                ) : undefined
            }
        />
    );
}
