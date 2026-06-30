import { useMemo, useState } from 'react';
import { LuPrinter as Printer, LuSearch as Search } from 'react-icons/lu';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Segmented from '@/components/ui/Segmented';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';
import { buildLabelSheetHtml, unitPriceSuffix } from '../lib/label-sheet-html';
import type { ILabelItem, LabelLayout } from '../lib/label-sheet-html';
import { usePrintLabelSheet } from '../hooks/usePrintLabelSheet';
import { LabelProductTable } from './LabelProductTable';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

const MAX_PER_PRODUCT = 99;

const LAYOUT_OPTIONS: { label: string; value: LabelLayout }[] = [
    { label: 'Price tag', value: 'price-tag' },
    { label: 'Shelf edge', value: 'shelf-edge' },
];

function clampQty(raw: string): number {
    return Math.min(MAX_PER_PRODUCT, Math.max(0, Math.floor(Number(raw) || 0)));
}

/**
 * Barcode label printing: filter by category, pick a layout, set how many
 * stickers each product needs (or bulk-apply to the whole filtered set), and
 * print an A4 sheet. Quantities live client-side only — nothing is persisted.
 */
export function LabelPrintPanel() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [layout, setLayout] = useState<LabelLayout>('price-tag');
    const [bulkQty, setBulkQty] = useState('1');
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

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const p of products) if (p.category) set.add(p.category);
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [products]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter((p) => {
            if (category && p.category !== category) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.barcode.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        });
    }, [products, search, category]);

    const totalLabels = useMemo(() => {
        let total = 0;
        for (const qty of quantities.values()) total += qty;
        return total;
    }, [quantities]);

    function setQty(productId: string, raw: string) {
        const qty = clampQty(raw);
        setQuantities((prev) => {
            const next = new Map(prev);
            if (qty === 0) next.delete(productId);
            else next.set(productId, qty);
            return next;
        });
    }

    /** Set the same quantity on every product currently in view. */
    function applyToFiltered() {
        const qty = clampQty(bulkQty);
        setQuantities((prev) => {
            const next = new Map(prev);
            for (const p of filtered) {
                if (qty === 0) next.delete(p.id);
                else next.set(p.id, qty);
            }
            return next;
        });
    }

    function handlePrint() {
        const labels: ILabelItem[] = [];
        for (const product of products) {
            const qty = quantities.get(product.id) ?? 0;
            if (qty === 0) continue;
            const suffix = unitPriceSuffix(product.baseUnit);
            // Weighed items show their PLU; otherwise shelf-edge shows category.
            const pluLine = product.pluCode
                ? `PLU ${product.pluCode}`
                : undefined;
            const secondaryLine =
                pluLine ??
                (layout === 'shelf-edge' ? product.category : undefined);
            for (let i = 0; i < qty; i++) {
                labels.push({
                    name: product.name,
                    barcode: product.barcode,
                    price: product.sellingPrice,
                    unitSuffix: suffix || undefined,
                    secondaryLine,
                });
            }
        }
        if (labels.length === 0) return;
        printLabelSheet(buildLabelSheetHtml(labels, { layout }));
        toast.success(`Sent ${labels.length} labels to print`);
    }

    return (
        <Card className="overflow-hidden">
            <div className="border-b border-border">
                <div className="flex flex-wrap items-center gap-2 p-3">
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
                    <select
                        className={`${INPUT_CLASS} max-w-[12rem]`}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        aria-label="Filter by category"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <Segmented
                        size="sm"
                        className="ml-auto"
                        value={layout}
                        onChange={setLayout}
                        options={LAYOUT_OPTIONS}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-text-3">
                            Set qty for the {filtered.length} shown
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-16 text-right`}
                            type="number"
                            min="0"
                            max={MAX_PER_PRODUCT}
                            step="1"
                            value={bulkQty}
                            onChange={(e) => setBulkQty(e.target.value)}
                            aria-label="Quantity to apply to all shown products"
                        />
                        <Button
                            variant="secondary"
                            onClick={applyToFiltered}
                            disabled={filtered.length === 0}
                        >
                            Apply to all
                        </Button>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[12px] text-text-3">
                            {totalLabels > 0
                                ? `${totalLabels} label${totalLabels === 1 ? '' : 's'} queued`
                                : 'No labels queued'}
                        </span>
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
            </div>
            {!productsQuery.isLoading && filtered.length === 0 ? (
                <EmptyState
                    title="No products found"
                    description="Adjust the search or category — only active products can be labelled."
                />
            ) : (
                <LabelProductTable
                    rows={filtered}
                    quantities={quantities}
                    max={MAX_PER_PRODUCT}
                    onQtyChange={setQty}
                />
            )}
        </Card>
    );
}
