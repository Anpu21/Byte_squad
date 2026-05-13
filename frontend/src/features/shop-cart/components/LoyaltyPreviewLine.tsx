import { Sparkles } from 'lucide-react';

interface LoyaltyPreviewLineProps {
    total: number;
}

export function LoyaltyPreviewLine({ total }: LoyaltyPreviewLineProps) {
    const expectedPoints = Math.floor(total / 100);
    if (expectedPoints <= 0) return null;

    const label =
        expectedPoints === 1
            ? "You'll earn ~1 pt on pickup"
            : `You'll earn ~${expectedPoints} pts on pickup`;

    return (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
            <Sparkles size={12} aria-hidden="true" />
            <span>{label}</span>
        </p>
    );
}
