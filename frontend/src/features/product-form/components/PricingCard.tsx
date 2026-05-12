import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from './FormField';
import type { ProductFormState } from '../hooks/useProductFormState';
import type { PriceDerived } from '../lib/price-math';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2,
    }).format(amount);
}

interface PricingCardProps {
    form: ProductFormState;
    derived: PriceDerived;
}

interface PriceInputProps {
    id: string;
    name: 'sellingPrice' | 'costPrice';
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}

function PriceInput({ id, name, label, value, onChange, error }: PriceInputProps) {
    return (
        <FormField label={label} htmlFor={id} error={error}>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-xs font-medium">
                    Rs
                </span>
                <input
                    id={id}
                    name={name}
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={Boolean(error)}
                    className={`w-full h-[38px] pl-9 pr-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors mono focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                        error ? 'border-danger' : 'border-border-strong hover:border-text-3'
                    }`}
                    placeholder="0.00"
                />
            </div>
        </FormField>
    );
}

export function PricingCard({ form, derived }: PricingCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PriceInput
                    id="product-selling-price"
                    name="sellingPrice"
                    label="Selling price (LKR)"
                    value={form.sellingPrice}
                    onChange={form.setSellingPrice}
                    error={form.errors.sellingPrice}
                />
                <PriceInput
                    id="product-cost-price"
                    name="costPrice"
                    label="Cost price (LKR)"
                    value={form.costPrice}
                    onChange={form.setCostPrice}
                    error={form.errors.costPrice}
                />
                {derived.marginPct !== null && derived.markupPct !== null && (
                    <div className="sm:col-span-2 flex items-center gap-4 px-3 py-2.5 rounded-md bg-surface-2 text-xs text-text-2">
                        <span>
                            Margin{' '}
                            <span className="mono font-semibold text-text-1">
                                {derived.marginPct.toFixed(1)}%
                            </span>
                        </span>
                        <span className="text-text-3">·</span>
                        <span>
                            Markup{' '}
                            <span className="mono font-semibold text-text-1">
                                {derived.markupPct.toFixed(1)}%
                            </span>
                        </span>
                        <span className="text-text-3">·</span>
                        <span>
                            Profit{' '}
                            <span className="mono font-semibold text-text-1">
                                {formatCurrency(derived.profitAbs ?? 0)}
                            </span>
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
