import { SchemesPanel } from '@/features/schemes/components/SchemesPanel';

/**
 * Discount-scheme management (admin + manager). Rules created here are
 * pulled by every till and applied automatically while in their date
 * window — the cashier's manual discount always wins.
 */
export function DiscountSchemesPage() {
    return <SchemesPanel />;
}
