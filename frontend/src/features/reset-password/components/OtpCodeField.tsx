import { useRef, useState } from 'react';

interface OtpCodeFieldProps {
    id?: string;
    label: string;
    value: string;
    onChange: (next: string) => void;
    error?: string;
    length?: number;
}

export function OtpCodeField({
    id = 'otp-code',
    label,
    value,
    onChange,
    error,
    length = 6,
}: OtpCodeFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);

    const digits = value.padEnd(length, ' ').split('').slice(0, length);

    return (
        <div>
            <label
                htmlFor={id}
                className="block text-xs font-medium text-text-2 mb-1.5"
            >
                {label}
            </label>
            <div
                className="relative cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={value}
                    onChange={(e) =>
                        onChange(
                            e.target.value.replace(/\D/g, '').slice(0, length),
                        )
                    }
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    aria-label={`${length}-digit verification code`}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                />
                <div className="flex gap-2 pointer-events-none">
                    {digits.map((d, i) => {
                        const isActive = focused && i === value.length;
                        const isFilled = i < value.length;
                        return (
                            <div
                                key={i}
                                className={`flex-1 h-12 mono text-xl font-semibold flex items-center justify-center rounded-md border bg-surface text-text-1 transition-colors ${
                                    isActive
                                        ? 'border-primary ring-[3px] ring-primary/30'
                                        : isFilled
                                          ? 'border-primary'
                                          : 'border-border-strong'
                                }`}
                            >
                                {d.trim() || ''}
                            </div>
                        );
                    })}
                </div>
            </div>
            {error && (
                <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>
            )}
        </div>
    );
}
