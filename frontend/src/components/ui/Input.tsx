import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, id, ...props }, ref) => {
        return (
            <div>
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-xs text-[var(--color-text-secondary)] mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={cn('glass-input w-full', error && 'border-red-500', className)}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-400 mt-1">{error}</p>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';
export default Input;
