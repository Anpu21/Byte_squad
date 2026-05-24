import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import type { ILoyaltySettings } from '@/types';
import { synthesizePreviewSale } from '@/features/pos/lib/synthesize-preview-sale';
import { PosBillTemplate } from '@/features/pos/components/bill-template/PosBillTemplate';

interface IPosBillLivePreviewProps {
    cart: readonly ICartItem[];
    invoiceNumber: string;
    cartDiscountPercentage: number;
    /** Loyalty owner attached upstream; stamps the preview footer when set. */
    loyaltyOwner?: IPosLoyaltyOwner | null;
    /** Whole points the cashier requested to redeem against the in-progress sale. */
    loyaltyRedeemPoints?: number;
    /** Loyalty rules used to estimate earned points client-side. */
    loyaltySettings?: ILoyaltySettings | null;
}

/**
 * Right-column live preview of the bill the cashier is currently
 * assembling. Mounts the same `PosBillTemplate` that prints, but driven
 * by an in-memory Sale synthesized from the cart (Phase B1 helper) so
 * the cashier can sanity-check the line items, units, totals and the
 * next invoice number before hitting Pay.
 *
 * The preview wrapper deliberately does NOT carry `data-pos-print-area`
 * — that attribute is reserved for the portalled `PosPrintHost` so the
 * `@media print` rules in `pos-bill-template.css` pick the right
 * element. The inner template still renders the marker on its own root
 * (it's the same component the print host uses), but because the
 * preview is mounted inside `#root` instead of as a direct `<body>`
 * child, the print stylesheet's `body > *` blanket-hide rule keeps it
 * suppressed at print time.
 *
 * The synthesized sale is memoised on the cart/invoice/discount inputs
 * so we don't rebuild a Sale-shaped object on every parent re-render
 * (the cashier types into discount fields fast enough that this
 * matters).
 */
export function PosBillLivePreview({
    cart,
    invoiceNumber,
    cartDiscountPercentage,
    loyaltyOwner,
    loyaltyRedeemPoints,
    loyaltySettings,
}: IPosBillLivePreviewProps) {
    const previewSale = useMemo(
        () =>
            synthesizePreviewSale({
                cart,
                invoiceNumber,
                cartDiscountPercentage,
                loyaltyOwner,
                loyaltyRedeemPoints,
                loyaltySettings,
            }),
        [
            cart,
            invoiceNumber,
            cartDiscountPercentage,
            loyaltyOwner,
            loyaltyRedeemPoints,
            loyaltySettings,
        ],
    );

    if (cart.length === 0) {
        return (
            <section
                aria-label="Bill preview"
                className="bg-surface border border-border-strong rounded-lg p-6 text-center"
            >
                <Receipt
                    size={20}
                    aria-hidden
                    className="mx-auto text-text-3"
                />
                <p className="mt-2 text-[12px] text-text-2">
                    Add items to preview the bill before charging.
                </p>
                {invoiceNumber ? (
                    <p className="mt-1 text-[11px] font-mono text-text-3">
                        Next: {invoiceNumber}
                    </p>
                ) : null}
            </section>
        );
    }

    return (
        <section
            aria-label="Bill preview"
            className="bg-surface border border-border-strong rounded-lg overflow-hidden"
        >
            <div className="max-h-[60vh] overflow-y-auto">
                <PosBillTemplate sale={previewSale} />
            </div>
        </section>
    );
}
