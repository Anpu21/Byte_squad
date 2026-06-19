import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PriceFieldWithUnit } from './PriceFieldWithUnit';
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

export function PricingCard({ form, derived }: PricingCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PriceFieldWithUnit
                    id="product-selling-price"
                    name="sellingPrice"
                    label="Selling price (LKR)"
                    value={form.sellingPrice}
                    onChange={form.setSellingPrice}
                    qty={form.sellingPriceQty}
                    onQtyChange={form.setSellingPriceQty}
                    unit={form.sellingPriceUnit}
                    onUnitChange={form.setSellingPriceUnit}
                    units={form.units}
                    baseUnit={form.baseUnit}
                    error={form.errors.sellingPrice}
                />
                <PriceFieldWithUnit
                    id="product-cost-price"
                    name="costPrice"
                    label="Cost price (LKR)"
                    value={form.costPrice}
                    onChange={form.setCostPrice}
                    qty={form.costPriceQty}
                    onQtyChange={form.setCostPriceQty}
                    unit={form.costPriceUnit}
                    onUnitChange={form.setCostPriceUnit}
                    units={form.units}
                    baseUnit={form.baseUnit}
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
