import { MULTI_TENDER_OVERPAY_ERROR } from '@/features/pos/lib/multi-tender';

interface IPosPaymentBannersProps {
    hasMultiTenderError: boolean;
    mutationError: Error | null;
}

/**
 * Two stacked alerts surfaced under the tender summary in the Charge
 * modal: the validation-level overpay warning (warning tone) and the
 * mutation-level submit failure (danger tone). Either can be present
 * independently — overpay is a frontend-only state and the mutation
 * error appears after a server roundtrip.
 */
export function PosPaymentBanners({
    hasMultiTenderError,
    mutationError,
}: IPosPaymentBannersProps) {
    return (
        <>
            {mutationError && (
                <p
                    role="alert"
                    className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-[12px] font-medium text-danger"
                >
                    Could not record the sale.{' '}
                    {mutationError.message ?? 'Retry the charge.'}
                </p>
            )}

            {hasMultiTenderError && (
                <p
                    role="alert"
                    className="rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-[12px] font-medium text-text-1"
                >
                    {MULTI_TENDER_OVERPAY_ERROR}. Enable "Keep balance" or
                    reduce the tender.
                </p>
            )}
        </>
    );
}
