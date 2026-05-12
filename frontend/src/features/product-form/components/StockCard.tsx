import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from './FormField';
import { inputClasses } from '../lib/input-classes';
import type { ProductFormState } from '../hooks/useProductFormState';

interface StockCardProps {
    form: ProductFormState;
}

export function StockCard({ form }: StockCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Stock</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    label="Initial stock quantity"
                    htmlFor="product-initial-stock"
                    error={form.errors.initialStock}
                    hint="Units to add at this branch right now."
                >
                    <input
                        id="product-initial-stock"
                        name="initialStock"
                        type="number"
                        min="0"
                        step="1"
                        value={form.initialStock}
                        onChange={(e) => form.setInitialStock(e.target.value)}
                        aria-invalid={Boolean(form.errors.initialStock)}
                        className={inputClasses(
                            Boolean(form.errors.initialStock),
                            'mono',
                        )}
                        placeholder="0"
                    />
                </FormField>
                <FormField
                    label="Low-stock threshold"
                    htmlFor="product-low-stock"
                    error={form.errors.lowStockThreshold}
                    hint="Alert when stock drops to this number."
                >
                    <input
                        id="product-low-stock"
                        name="lowStockThreshold"
                        type="number"
                        min="1"
                        step="1"
                        value={form.lowStockThreshold}
                        onChange={(e) =>
                            form.setLowStockThreshold(e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.lowStockThreshold)}
                        className={inputClasses(
                            Boolean(form.errors.lowStockThreshold),
                            'mono',
                        )}
                        placeholder="10"
                    />
                </FormField>
            </CardContent>
        </Card>
    );
}
