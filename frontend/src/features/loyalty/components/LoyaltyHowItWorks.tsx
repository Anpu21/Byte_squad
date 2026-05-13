import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function LoyaltyHowItWorks() {
    const [open, setOpen] = useState(true);

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
                    <li>Earn 1 point for every LKR 100 paid at pickup</li>
                    <li>Redeem 1 point as LKR 1 off any order</li>
                    <li>Use up to 20% of any order subtotal in points</li>
                    <li>Points reverse if you cancel before pickup</li>
                </ul>
            )}
        </section>
    );
}
