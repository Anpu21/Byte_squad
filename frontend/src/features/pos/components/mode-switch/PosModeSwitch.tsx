import { LuReceiptText as ReceiptText, LuScanLine as ScanLine } from 'react-icons/lu';
import { Tabs, type TabItem } from '@/components/ui';

export type PosMode = 'billing' | 'scan';

const MODES: TabItem<PosMode>[] = [
    { key: 'billing', label: 'Billing', Icon: ReceiptText },
    { key: 'scan', label: 'Scan Pickup', Icon: ScanLine },
];

interface PosModeSwitchProps {
    mode: PosMode;
    onChange: (mode: PosMode) => void;
}

/**
 * Billing ⇄ Scan-Pickup workspace toggle for the cashier POS. Uses the shared
 * `Tabs` pill primitive (no longer hand-rolled) so it stays visually identical
 * to every other tab bar; it sits inline in the POS toolbar — not in a sticky
 * band — so the billing grid layout is untouched.
 */
export function PosModeSwitch({ mode, onChange }: PosModeSwitchProps) {
    return (
        <Tabs
            tabs={MODES}
            active={mode}
            onChange={onChange}
            ariaLabel="POS workspace mode"
        />
    );
}
