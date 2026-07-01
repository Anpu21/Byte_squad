import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from './FormField';
import { inputClasses, textareaClasses } from '../lib/input-classes';
import { BarcodeInput } from './BarcodeInput';
import type { ProductFormState } from '../hooks/useProductFormState';

interface BasicsCardProps {
    form: ProductFormState;
    categories: string[];
    brands: string[];
    isEditMode: boolean;
    onLookupBarcode: (barcode: string) => void;
    onOpenCamera: () => void;
}

export function BasicsCard({
    form,
    categories,
    brands,
    isEditMode,
    onLookupBarcode,
    onOpenCamera,
}: BasicsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    label="Name"
                    htmlFor="product-name"
                    error={form.errors.name}
                    className="sm:col-span-2"
                >
                    <input
                        id="product-name"
                        name="name"
                        value={form.name}
                        onChange={(e) => form.setName(e.target.value)}
                        aria-invalid={Boolean(form.errors.name)}
                        className={inputClasses(Boolean(form.errors.name))}
                        placeholder="e.g. Coca-Cola 1L PET"
                    />
                </FormField>

                <FormField
                    label="Category"
                    htmlFor="product-category"
                    error={form.errors.category}
                >
                    <input
                        id="product-category"
                        name="category"
                        value={form.category}
                        onChange={(e) => form.setCategory(e.target.value)}
                        list="category-list"
                        aria-invalid={Boolean(form.errors.category)}
                        className={inputClasses(Boolean(form.errors.category))}
                        placeholder="Select or type a category"
                    />
                    <datalist id="category-list">
                        {categories.map((cat) => (
                            <option key={cat} value={cat} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Brand (optional)" htmlFor="product-brand">
                    <input
                        id="product-brand"
                        name="brand"
                        value={form.brand}
                        onChange={(e) => form.setBrand(e.target.value)}
                        list="brand-list"
                        className={inputClasses(false)}
                        placeholder="Select or type a brand"
                    />
                    <datalist id="brand-list">
                        {brands.map((b) => (
                            <option key={b} value={b} />
                        ))}
                    </datalist>
                </FormField>

                <BarcodeInput
                    form={form}
                    isEditMode={isEditMode}
                    onLookup={onLookupBarcode}
                    onOpenCamera={onOpenCamera}
                />

                {form.baseUnit !== 'unit' && (
                    <FormField
                        label="PLU code (scale barcodes)"
                        htmlFor="product-plu"
                        error={form.errors.pluCode}
                    >
                        <input
                            id="product-plu"
                            name="pluCode"
                            inputMode="numeric"
                            value={form.pluCode}
                            onChange={(e) => form.setPluCode(e.target.value)}
                            aria-invalid={Boolean(form.errors.pluCode)}
                            className={inputClasses(Boolean(form.errors.pluCode))}
                            placeholder="e.g. 00042"
                        />
                    </FormField>
                )}

                <FormField
                    label="Description (optional)"
                    htmlFor="product-description"
                    className="sm:col-span-2"
                >
                    <textarea
                        id="product-description"
                        value={form.description}
                        onChange={(e) => form.setDescription(e.target.value)}
                        rows={3}
                        className={textareaClasses(false, 'resize-none')}
                        placeholder="Brief product description"
                    />
                </FormField>
            </CardContent>
        </Card>
    );
}
