import type { ProductFormErrors } from '../types/form-errors.type';

export interface ProductFormValues {
    name: string;
    barcode: string;
    category: string;
    costPrice: string;
    sellingPrice: string;
    initialStock: string;
    lowStockThreshold: string;
}

export function validateProductForm(
    values: ProductFormValues,
    isEditMode: boolean,
): ProductFormErrors {
    const errors: ProductFormErrors = {};
    if (!values.name.trim()) errors.name = 'Product name is required';
    if (!values.barcode.trim()) errors.barcode = 'Barcode is required';
    if (!values.category.trim()) errors.category = 'Category is required';

    const cost = parseFloat(values.costPrice);
    if (isNaN(cost) || cost < 0)
        errors.costPrice = 'Cost price must be a positive number';

    const sell = parseFloat(values.sellingPrice);
    if (isNaN(sell) || sell < 0)
        errors.sellingPrice = 'Selling price must be a positive number';

    if (!isEditMode) {
        const qty = parseInt(values.initialStock, 10);
        if (values.initialStock !== '' && (isNaN(qty) || qty < 0))
            errors.initialStock = 'Stock must be 0 or more';
        const threshold = parseInt(values.lowStockThreshold, 10);
        if (isNaN(threshold) || threshold < 1)
            errors.lowStockThreshold = 'Threshold must be at least 1';
    }
    return errors;
}

const FIELD_FOCUS_ORDER: (keyof ProductFormErrors)[] = [
    'name',
    'category',
    'barcode',
    'sellingPrice',
    'costPrice',
    'initialStock',
    'lowStockThreshold',
];

export function focusFirstInvalidField(errors: ProductFormErrors): void {
    const firstKey = FIELD_FOCUS_ORDER.find((k) => errors[k]);
    if (!firstKey) return;
    requestAnimationFrame(() => {
        const form = document.getElementById('product-form');
        const el = form?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus({ preventScroll: true });
        }
    });
}
