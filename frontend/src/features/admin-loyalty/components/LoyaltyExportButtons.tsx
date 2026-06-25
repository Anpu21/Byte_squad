import { LuFileSpreadsheet as FileSpreadsheet, LuFileText as FileText } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { exportData, type ExportColumn } from '@/lib/exportUtils';
import type { ILoyaltyCustomerRow } from '@/types';

interface LoyaltyExportButtonsProps {
    data: ILoyaltyCustomerRow[];
    disabled?: boolean;
}

export function LoyaltyExportButtons({ data, disabled }: LoyaltyExportButtonsProps) {
    const handleExport = (format: 'pdf' | 'excel') => {
        const columns: ExportColumn<ILoyaltyCustomerRow>[] = [
            { header: 'Name', key: 'firstName' }, // simplified for brevity
            { header: 'Tier', key: 'tier' },
            { header: 'Balance', key: 'pointsBalance', align: 'right', format: 'text' },
            { header: 'Lifetime Earned', key: 'lifetimePointsEarned', align: 'right', format: 'text' },
            { header: 'Lifetime Redeemed', key: 'lifetimePointsRedeemed', align: 'right', format: 'text' },
        ];

        exportData(format, data, columns, {
            title: 'Loyalty Customers Report',
            filenameBase: 'Loyalty_Customers',
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('excel')}
                disabled={disabled || data.length === 0}
                className="h-8"
            >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Excel
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={disabled || data.length === 0}
                className="h-8"
            >
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                PDF
            </Button>
        </div>
    );
}
