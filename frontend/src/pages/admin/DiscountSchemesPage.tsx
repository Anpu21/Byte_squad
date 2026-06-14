import PageHeader from '@/components/ui/PageHeader';
import { SchemesPanel } from '@/features/schemes/components/SchemesPanel';

/**
 * Discount-scheme management (admin + manager). Rules created here are
 * pulled by every till and applied automatically while in their date
 * window — the cashier's manual discount always wins.
 */
export function DiscountSchemesPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                eyebrow="Operations"
                title="Discount schemes"
                subtitle="Automatic POS discounts by product or category — date windows, quantity slabs, per-branch or storewide."
            />
            <SchemesPanel />
        </div>
    );
}
