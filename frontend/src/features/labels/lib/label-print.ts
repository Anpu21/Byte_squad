import type { IProduct } from '@/types';
import { unitPriceSuffix } from './label-sheet-html';
import type { ILabelItem, LabelLayout } from './label-sheet-html';

export const MAX_PER_PRODUCT = 99;

export const LAYOUT_OPTIONS: { label: string; value: LabelLayout }[] = [
    { label: 'Price tag', value: 'price-tag' },
    { label: 'Shelf edge', value: 'shelf-edge' },
];

export function clampQty(raw: string): number {
    return Math.min(MAX_PER_PRODUCT, Math.max(0, Math.floor(Number(raw) || 0)));
}

/** Expand the per-product sticker counts into a flat list of label items. */
export function buildPrintLabels(
    products: IProduct[],
    quantities: Map<string, number>,
    layout: LabelLayout,
): ILabelItem[] {
    const labels: ILabelItem[] = [];
    for (const product of products) {
        const qty = quantities.get(product.id) ?? 0;
        if (qty === 0) continue;
        const suffix = unitPriceSuffix(product.baseUnit);
        // Weighed items show their PLU; otherwise shelf-edge shows category.
        const pluLine = product.pluCode ? `PLU ${product.pluCode}` : undefined;
        const secondaryLine =
            pluLine ?? (layout === 'shelf-edge' ? product.category : undefined);
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
    return labels;
}
