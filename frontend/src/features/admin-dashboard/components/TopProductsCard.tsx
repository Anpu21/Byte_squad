import Card from '@/components/ui/Card';
import { EmptyState } from '@/components/ui';
import type { ITopProduct } from '@/types';
import { formatRevenue } from '../lib/format';

interface TopProductsCardProps {
    products: ITopProduct[];
}

export function TopProductsCard({ products }: TopProductsCardProps) {
    const maxRevenue = products[0]?.totalRevenue || 1;

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Top Products by Revenue
                </h3>
            </div>
            {products.length === 0 ? (
                <EmptyState title="No product data yet" />
            ) : (
                <ul className="flex flex-col gap-3">
                    {products.slice(0, 5).map((product, idx) => {
                        const pct = (product.totalRevenue / maxRevenue) * 100;
                        return (
                            <li key={product.productId} className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-lg bg-primary-soft text-primary mono text-xs font-semibold inline-flex items-center justify-center shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[13px] font-medium text-text-1 truncate">
                                            {product.productName}
                                        </span>
                                        <span className="mono text-xs font-semibold text-text-1 shrink-0">
                                            {formatRevenue(product.totalRevenue)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mt-1.5">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="mono text-[11px] text-text-3 mt-1">
                                        {product.totalQuantity} sold
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}
