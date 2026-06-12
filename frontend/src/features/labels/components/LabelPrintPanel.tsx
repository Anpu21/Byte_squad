import { useMemo, useState } from 'react';
import { Printer, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/utils';
import { buildLabelSheetHtml } from '../lib/label-sheet-html';
import type { ILabelItem } from '../lib/label-sheet-html';
import { usePrintLabelSheet } from '../hooks/usePrintLabelSheet';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

const MAX_PER_PRODUCT = 99;

/**
 * Barcode label printing: pick how many stickers each product needs and
 * print an A4 sheet (name, price, Code 128 barcode). Quantities live
 * client-side only — nothing is persisted.
 */
export function LabelPrintPanel() {
    const [search, setSearch] = useState('');
    const [quantities, setQuantities] = useState<Map<string, number>>(
        new Map(),
    );
    const { printLabelSheet } = usePrintLabelSheet();

    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: inventoryService.getProducts,
    });
    const products = useMemo(
        () => (productsQuery.data ?? []).filter((p) => p.isActive),
        [productsQuery.data],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return products;
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.barcode.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q),
        );
    }, [products, search]);

    const totalLabels = useMemo(() => {
        let total = 0;
        for (const qty of quantities.values()) total += qty;
        return total;
    }, [quantities]);

    function setQty(productId: string, raw: string) {
        const qty = Math.min(
            MAX_PER_PRODUCT,
            Math.max(0, Math.floor(Number(raw) || 0)),
        );
        setQuantities((prev) => {
            const next = new Map(prev);
            if (qty === 0) next.delete(productId);
            else next.set(productId, qty);
            return next;
        });
    }

    function handlePrint() {
        const labels: ILabelItem[] = [];
        for (const product of products) {
            const qty = quantities.get(product.id) ?? 0;
            for (let i = 0; i < qty; i++) {
                labels.push({
                    name: product.name,
                    barcode: product.barcode,
                    price: product.sellingPrice,
                });
            }
        }
        if (labels.length === 0) return;
        printLabelSheet(buildLabelSheetHtml(labels));
        toast.success(`Sent ${labels.length} labels to print`);
    }

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3"
                        aria-hidden
                    />
                    <input
                        className={`${INPUT_CLASS} pl-8 w-64`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, barcode, category…"
                        aria-label="Search products"
                    />
                </div>
                <span className="text-[12px] text-text-3">
                    {totalLabels > 0
                        ? `${totalLabels} label${totalLabels === 1 ? '' : 's'} queued`
                        : 'Set a quantity next to each product'}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    {totalLabels > 0 && (
                        <Button
                            variant="ghost"
                            onClick={() => setQuantities(new Map())}
                        >
                            Clear
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        onClick={handlePrint}
                        disabled={totalLabels === 0}
                    >
                        <Printer size={14} aria-hidden />
                        Print sheet
                    </Button>
                </div>
            </div>
            {!productsQuery.isLoading && filtered.length === 0 ? (
                <EmptyState
                    title="No products found"
                    description="Adjust the search — only active products can be labelled."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-2/60 border-b border-border">
                            <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                <th className="px-3 py-2.5 font-medium">
                                    Product
                                </th>
                                <th className="px-3 py-2.5 font-medium">
                                    Barcode
                                </th>
                                <th className="px-3 py-2.5 font-medium text-right">
                                    Price
                                </th>
                                <th className="px-3 py-2.5 font-medium text-right">
                                    Labels
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
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
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-text-1 text-right tabular-nums">
                                        {formatCurrency(p.sellingPrice)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        <input
                                            className={`${INPUT_CLASS} w-20 text-right`}
                                            type="number"
                                            min="0"
                                            max={MAX_PER_PRODUCT}
                                            step="1"
                                            value={String(
                                                quantities.get(p.id) ?? 0,
                                            )}
                                            onChange={(e) =>
                                                setQty(p.id, e.target.value)
                                            }
                                            aria-label={`Labels for ${p.name}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
