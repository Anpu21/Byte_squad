import type { ISaleLoyaltyResult } from '@/types';

interface IPosBillLoyaltyFooterProps {
    loyalty: ISaleLoyaltyResult;
}

/**
 * Receipt footer block that prints the loyalty side-effect summary
 * the backend appended to the create-sale response. Lives in its own
 * file so the parent `PosBillTemplate` stays under the file-size
 * budget; the same component is mounted by the live preview via
 * `synthesizePreviewSale`, so the printed copy and the cashier's
 * on-screen preview render byte-identical footers.
 */
export function PosBillLoyaltyFooter({ loyalty }: IPosBillLoyaltyFooterProps) {
    return (
        <section
            aria-label="Loyalty summary"
            className="pos-bill__loyalty mt-2 text-[11px] tabular-nums"
        >
            <p className="text-center text-[10px] uppercase tracking-wide text-text-2">
                — Loyalty —
            </p>
            <FooterRow
                label="Earned"
                value={`+${loyalty.earned.toLocaleString()} pts`}
            />
            {loyalty.redeemed > 0 ? (
                <FooterRow
                    label="Redeemed"
                    value={`−${loyalty.redeemed.toLocaleString()} pts`}
                />
            ) : null}
            <FooterRow
                label="Balance"
                value={`${loyalty.newBalance.toLocaleString()} pts`}
                emphasis
            />
        </section>
    );
}

interface IFooterRowProps {
    label: string;
    value: string;
    emphasis?: boolean;
}

function FooterRow({ label, value, emphasis }: IFooterRowProps) {
    const size = emphasis ? 'text-[12px] font-semibold' : 'text-[11px]';
    return (
        <div className={`flex items-baseline justify-between ${size}`}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
