interface PasswordStrengthProps {
    password: string;
}

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; tone: string };

function scorePassword(pw: string): Strength {
    if (!pw) return { score: 0, label: '', tone: 'bg-border' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
    const tones = [
        'bg-danger',
        'bg-danger',
        'bg-warning',
        'bg-info',
        'bg-accent',
    ] as const;
    return { score: clamped, label: labels[clamped], tone: tones[clamped] };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
    const { score, label, tone } = scorePassword(password);
    const segments = [0, 1, 2, 3];
    return (
        <div className="mt-2" aria-live="polite">
            <div className="flex gap-1">
                {segments.map((i) => (
                    <span
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                            i < score ? tone : 'bg-border'
                        }`}
                    />
                ))}
            </div>
            <p className="mt-1 text-[11px] text-text-3">
                Password strength:{' '}
                <span className="font-semibold text-text-2">{label}</span>
            </p>
        </div>
    );
}
