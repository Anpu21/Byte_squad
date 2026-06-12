import PageHeader from '@/components/ui/PageHeader';
import { SalesmanReportPanel } from '@/features/reports/components/SalesmanReportPanel';
import { ReportLinksGrid } from '@/features/reports/components/ReportLinksGrid';

/**
 * Unified Reports hub: the cashier-wise sales report inline (the one
 * report that had no home), plus a role-aware launcher for every other
 * report surface in the app.
 */
export function ReportsHubPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                eyebrow="Operations"
                title="Reports"
                subtitle="Cashier performance at a glance, and one place to reach every other report."
            />
            <SalesmanReportPanel />
            <section aria-label="All reports" className="space-y-2">
                <h2 className="text-[11px] uppercase tracking-wide text-text-3">
                    All reports
                </h2>
                <ReportLinksGrid />
            </section>
        </div>
    );
}
