import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLoyaltySettings } from '../hooks/useLoyaltySettings';
import {
    formatEarnRule,
    formatPointValueRule,
    formatRedeemCapRule,
} from '../lib/format-loyalty-rules';

export function LoyaltyHowItWorks() {
    const [open, setOpen] = useState(true);
    const { data: settings } = useLoyaltySettings();

    return (
        <section className="bg-surface border border-border rounded-md mb-6">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 rounded-md"
            >
                <span>How it works</span>
                <ChevronDown
                    size={16}
                    className={`transition-transform ${open ? '' : '-rotate-90'}`}
                />
            </button>
            {open && (
                <ul className="px-4 pb-4 space-y-1.5 text-sm text-text-2 list-disc list-inside">
                    <li>{formatEarnRule(settings)}</li>
                    <li>{formatPointValueRule(settings)}</li>
                    <li>{formatRedeemCapRule(settings)}</li>
                    <li>Points reverse if you cancel before pickup</li>
                </ul>
            )}
        </section>
    );
}
