import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { ITopProduct } from '@/types';
import { formatRevenue } from '../lib/format';

interface TopProductsCardProps {
    products: ITopProduct[];
}

export function TopProductsCard({ products }: TopProductsCardProps) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Top products today
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">Ranked by revenue</p>
                </div>
            </div>
            {products.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {products.slice(0, 5).map((product, idx) => {
                        const maxRevenue = products[0]?.totalRevenue || 1;
                        const pct = (product.totalRevenue / maxRevenue) * 100;
                        return (
                            <div key={product.productId}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="mono text-xs text-text-3 w-4">
                                            {idx + 1}
                                        </span>
                                        <span className="text-[13px] font-medium text-text-1 truncate">
                                            {product.productName}
                                        </span>
                                    </div>
                                    <span className="mono text-xs text-text-1 font-semibold flex-shrink-0">
                                        {formatRevenue(product.totalRevenue)}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <p className="mono text-[11px] text-text-3 mt-0.5">
                                    {product.totalQuantity} sold
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState title="No product data yet" />
            )}
        </Card>
    );
}
