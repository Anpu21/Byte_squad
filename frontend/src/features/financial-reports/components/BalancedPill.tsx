import Pill from '@/components/ui/Pill';

/** Green/red books-equality badge shared by the trial balance + balance sheet. */
export function BalancedPill({ balanced }: { balanced: boolean }) {
    return (
        <Pill tone={balanced ? 'success' : 'danger'}>
            {balanced ? 'Balanced' : 'Out of balance'}
        </Pill>
    );
}
