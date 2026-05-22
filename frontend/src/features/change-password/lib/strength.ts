export interface StrengthMeter {
    score: number;
    label: string;
    pct: number;
    color: string;
}

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];

export function computeStrength(password: string): StrengthMeter {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return {
        score,
        label: LABELS[score],
        pct: (Math.max(score, 1) / 5) * 100,
        color:
            score <= 1
                ? 'var(--danger)'
                : score <= 3
                  ? 'var(--warning)'
                  : 'var(--accent)',
    };
}
