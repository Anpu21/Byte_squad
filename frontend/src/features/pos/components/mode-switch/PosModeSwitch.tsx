import { LuReceiptText as ReceiptText, LuScanLine as ScanLine } from 'react-icons/lu';
import { type IconType as LucideIcon } from 'react-icons';

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
            className="inline-flex items-center gap-1 p-[5px] bg-surface-2 rounded-[12px] border border-border w-fit"
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
                        className={`inline-flex items-center gap-2 px-4 py-[9px] rounded-md text-[13px] font-semibold whitespace-nowrap transition-all duration-150 outline-none active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-focus/25 ${
                            isActive
                                ? 'bg-primary text-text-inv shadow-sm-token'
                                : 'text-text-2 hover:text-text-1 hover:bg-surface'
                        }`}
                    >
                        <Icon size={15} strokeWidth={2.1} aria-hidden />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
