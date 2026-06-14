import PageHeader from '@/components/ui/PageHeader';
import { ReportLinksGrid } from '@/features/reports/components/ReportLinksGrid';

/**
 * Reports hub: a role-aware launcher for every report surface in the app.
 * (The cashier-wise salesman report now lives in the Sales workspace.)
 */
export function ReportsHubPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                eyebrow="Insights"
                title="Reports"
                subtitle="One place to reach every report across the app."
            />
            <ReportLinksGrid />
        </div>
    );
}
