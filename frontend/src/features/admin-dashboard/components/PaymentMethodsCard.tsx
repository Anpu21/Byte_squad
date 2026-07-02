import Card from '@/components/ui/Card';
import DonutChart, { type DonutSlice } from '@/components/charts/DonutChart';
import { PaymentMethod } from '@/constants/enums';
import type { IPaymentMethodBreakdown } from '@/types';
import { formatCompact, formatRevenue } from '../lib/format';

interface PaymentMethodsCardProps {
    data: IPaymentMethodBreakdown[];
}

// Stable order/labels/colours so slice colours stay put when a method has 0
// sales. The shop accepts Cash + Card in-store and Online (card via PayHere)
// on the storefront; Mobile was retired as a tender.
const ORDER: { method: PaymentMethod; label: string; color: string }[] = [
    { method: PaymentMethod.CASH, label: 'Cash', color: 'var(--primary)' },
    { method: PaymentMethod.CARD, label: 'Card', color: 'var(--accent)' },
    { method: PaymentMethod.ONLINE, label: 'Online', color: 'var(--info)' },
];

export function PaymentMethodsCard({ data }: PaymentMethodsCardProps) {
    const slices: DonutSlice[] = [];
    let total = 0;

    for (const { method, label, color } of ORDER) {
        const amount = data.find((row) => row.method === method)?.total ?? 0;
        total += amount;
        if (amount > 0) {
            slices.push({ name: label, value: amount, color });
        }
    }

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Sales by Payment Method
                </h3>
            </div>
            <DonutChart
                data={slices}
                formatValue={formatRevenue}
                centerValue={formatCompact(total)}
                centerLabel="Total"
            />
        </Card>
    );
}
