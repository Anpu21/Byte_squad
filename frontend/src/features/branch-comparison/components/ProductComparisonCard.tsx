import { LuStar as Star } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import { formatCurrencyWhole } from '../lib/format';

export interface ProductBranchCell {
    branchId: string;
    branchName: string;
    revenue: number;
    quantity: number;
}

export interface ProductCardData {
    productId: string;
    productName: string;
    totalRevenue: number;
    maxRevenue: number;
    leaderBranchId: string | null;
    cells: ProductBranchCell[];
}

interface ProductComparisonCardProps {
    product: ProductCardData;
    /** Resolve a branch's identity colour (shared across the comparison page). */
    colorFor: (branchId: string) => string;
}

/** One product card: each branch as a coloured bar row, leader badged. */
export function ProductComparisonCard({
    product,
    colorFor,
}: ProductComparisonCardProps) {
    return (
        <Card className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-[13px] font-semibold text-text-1 leading-snug">
                    {product.productName}
                </p>
                {product.leaderBranchId && (
                    <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-text">
                        <Star size={10} fill="currentColor" aria-hidden="true" />
                        Leader
                    </span>
                )}
            </div>

            <ul className="space-y-2.5">
                {product.cells.map((cell) => {
                    const color = colorFor(cell.branchId);
                    const isLeader = product.leaderBranchId === cell.branchId;
                    const pct =
                        product.maxRevenue > 0
                            ? (cell.revenue / product.maxRevenue) * 100
                            : 0;
                    return (
                        <li
                            key={cell.branchId}
                            className="flex items-center gap-3"
                        >
                            <span className="flex min-w-0 items-center gap-1.5 basis-[34%] shrink-0">
                                <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: color }}
                                    aria-hidden="true"
                                />
                                <span
                                    className={`truncate text-[12px] ${
                                        isLeader
                                            ? 'font-semibold text-text-1'
                                            : 'text-text-2'
                                    }`}
                                >
                                    {cell.branchName}
                                </span>
                            </span>

                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                                <span
                                    className="block h-full rounded-full transition-[width]"
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: color,
                                    }}
                                />
                            </span>

                            <span className="shrink-0 text-right">
                                <span className="block mono tabular-nums text-[12px] text-text-1">
                                    {formatCurrencyWhole(cell.revenue)}
                                </span>
                                <span className="block mono tabular-nums text-[10px] text-text-3">
                                    {cell.quantity.toLocaleString()} qty
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
}
