import { useNavigate } from 'react-router-dom';
import { LuPlus as Plus } from 'react-icons/lu';
import { Button, PageHeader } from '@/components/ui';
import ExportMenu from '@/components/common/ExportMenu';
import { FRONTEND_ROUTES } from '@/constants/routes';
import {
    exportData,
    type ExportColumn,
    type ExportFormat,
} from '@/lib/exportUtils';
import type { ISale } from '@/types';
import { DateRangeButton } from './DateRangeButton';

type RecentTransaction = ISale & {
    branch?: { name: string };
};

interface DashboardHeaderProps {
    recentTransactions: RecentTransaction[];
}

const EXPORT_COLUMNS: ExportColumn<RecentTransaction>[] = [
    { header: 'Invoice', key: 'invoiceNumber' },
    { header: 'Date', key: 'createdAt', format: 'date' },
    { header: 'Branch', key: 'branch.name' },
    { header: 'Payment', key: 'paymentMethod' },
    { header: 'Status', key: 'paymentStatus' },
    {
        header: 'Amount',
        key: 'total',
        align: 'right',
        format: 'currency',
        footer: 'sum',
    },
];

/**
 * Page header for the overview. Title + subtitle match the design; the actions
 * reuse existing primitives — a cosmetic date-range chip, the shared
 * {@link ExportMenu} (PDF/Excel of recent transactions) for "Download Report",
 * and an "Add Sale" CTA that SPA-navigates to the POS (the POS page owns the
 * branch guard — we never submit a sale from here).
 */
export function DashboardHeader({ recentTransactions }: DashboardHeaderProps) {
    const navigate = useNavigate();

    const handleExport = async (format: ExportFormat) => {
        await exportData(format, recentTransactions, EXPORT_COLUMNS, {
            title: 'Dashboard — Recent Transactions',
            subtitle: 'Latest sales across all branches',
            filenameBase: 'dashboard-transactions',
        });
    };

    return (
        <PageHeader
            title="Dashboard"
            subtitle="Overview of your business performance"
            actions={
                <>
                    <DateRangeButton />
                    <ExportMenu onExport={handleExport} />
                    <Button onClick={() => navigate(FRONTEND_ROUTES.POS)}>
                        <Plus size={16} /> Add Sale
                    </Button>
                </>
            }
        />
    );
}
