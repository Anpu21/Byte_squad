import { ReceiptText, ScanLine, type LucideIcon } from 'lucide-react';

export type PosMode = 'billing' | 'scan';

interface ModeDef {
    key: PosMode;
    label: string;
    Icon: LucideIcon;
}

const MODES: ModeDef[] = [
    { key: 'billing', label: 'Billing', Icon: ReceiptText },
    { key: 'scan', label: 'Scan Pickup', Icon: ScanLine },
];

interface PosModeSwitchProps {
    mode: PosMode;
    onChange: (mode: PosMode) => void;
}

/**
 * Billing ⇄ Scan-Pickup workspace toggle for the cashier POS. Same
 * segmented-tabs idiom as `AdminHrTabs`; the page swaps the content
 * below the switch while the billing grid itself stays untouched.
 */
export function PosModeSwitch({ mode, onChange }: PosModeSwitchProps) {
    return (
        <div
            className="flex items-center gap-1 p-1 bg-surface-2 rounded-xl border border-border w-fit"
            role="tablist"
            aria-label="POS workspace mode"
        >
            {MODES.map(({ key, label, Icon }) => {
                const isActive = mode === key;
                return (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(key)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                            isActive
                                ? 'bg-primary text-text-inv shadow-sm'
                                : 'text-text-2 hover:text-text-1 hover:bg-surface'
                        }`}
                    >
                        <Icon size={14} strokeWidth={2} aria-hidden />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
