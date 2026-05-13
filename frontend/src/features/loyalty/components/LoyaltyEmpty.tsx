import { Sparkles } from 'lucide-react';

export function LoyaltyEmpty() {
    return (
        <div className="bg-surface border border-border rounded-md p-8 text-center">
            <Sparkles
                size={28}
                className="mx-auto text-text-3"
                aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-text-1">
                No activity yet
            </p>
            <p className="mt-1 text-xs text-text-2">
                Place your first pickup order to start earning rewards.
            </p>
        </div>
    );
}
