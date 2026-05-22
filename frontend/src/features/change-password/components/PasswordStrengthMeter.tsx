import { computeStrength } from '../lib/strength';

interface PasswordStrengthMeterProps {
    password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    if (!password) return null;
    const { label, pct, color } = computeStrength(password);

    return (
        <>
            <div className="h-1.5 bg-surface-2 rounded-full mt-2 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <p
                className="text-xs mt-1 font-medium"
                style={{ color }}
            >
                {label}
            </p>
        </>
    );
}
