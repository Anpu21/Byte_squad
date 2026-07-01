import { formatCurrency } from '@/lib/utils';
import type { IProduct } from '@/types';
import { unitPriceSuffix } from '../lib/label-sheet-html';
import { FIELD_SHELL, FIELD_BORDER, Pagination } from '@/components/ui';
import { usePagination } from '@/hooks/usePagination';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';

const QTY_INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 w-20 px-3 text-right`;

interface ILabelProductTableProps {
    rows: IProduct[];
    quantities: Map<string, number>;
    max: number;
    onQtyChange: (productId: string, raw: string) => void;
}

/**
 * The labelable-products grid: product, barcode, price, and a per-row sticker
 * count. Quantities are owned by the parent {@link LabelPrintPanel}.
 */
export function LabelProductTable({
    rows,
    quantities,
    max,
    onQtyChange,
}: ILabelProductTableProps) {
    const { page, setPage, pageRows, total } = usePagination(rows);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-3 py-2.5 font-medium">Product</th>
                        <th className="px-3 py-2.5 font-medium">Barcode</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Price
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Labels
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {pageRows.map((p) => (
                        <tr
                            key={p.id}
                            className="border-b border-border hover:bg-surface-2/40 transition-colors"
                        >
                            <td className="px-3 py-2.5 text-[13px] font-medium text-text-1">
                                {p.name}
                                <span className="block text-[11px] font-normal text-text-3">
                                    {p.category}
                                </span>
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 tabular-nums">
                                {p.barcode || '—'}
                                {p.pluCode && (
                                    <span className="block text-[11px] text-text-3">
                                        PLU {p.pluCode}
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-1 text-right tabular-nums">
                                {formatCurrency(p.sellingPrice)}
                                <span className="text-text-3">
                                    {unitPriceSuffix(p.baseUnit)}
                                </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                                <input
                                    className={QTY_INPUT_CLASS}
                                    type="number"
                                    min="0"
                                    max={max}
                                    step="1"
                                    value={String(quantities.get(p.id) ?? 0)}
                                    onChange={(e) =>
                                        onQtyChange(p.id, e.target.value)
                                    }
                                    aria-label={`Labels for ${p.name}`}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {total > 0 && (
                <Pagination
                    page={page}
                    pageSize={DEFAULT_PAGE_SIZE}
                    total={total}
                    onPageChange={setPage}
                    unit="products"
                />
            )}
        </div>
    );
}
