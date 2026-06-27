import { LuShoppingCart as ShoppingCart } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Segmented from '@/components/ui/Segmented';
import { QuantityField } from '@/components/shop/QuantityField';
import { AmountField } from '@/components/shop/AmountField';
import { formatCurrency } from '@/lib/utils';
import { formatQty } from '@/lib/unit-quantity';

type EntryMode = 'weight' | 'amount';

interface ProductDetailActionsProps {
    /** Weight ('By weight') vs cash ('By amount') entry. */
    entryMode: EntryMode;
    onEntryModeChange: (mode: EntryMode) => void;
    /** Loose product? Gates the toggle + the cash↔weight previews. */
    isFractional: boolean;

    qty: number;
    onQtyChange: (next: number) => void;
    step: number;
    decimals: number;
    unitLabel: string;

    amount: number;
    onAmountChange: (next: number) => void;
    /** Weight the entered cash buys (amount-mode preview). */
    derivedQty: number;
    /** Cash the chosen weight costs (weight-mode preview). */
    previewAmount: number;

    /** False when below the order minimum (e.g. 0 / sub-minimum) — Add/Buy off. */
    canAdd: boolean;
    onAdd: () => void;
    onBuyNow: () => void;
    disabled: boolean;
}

/** Quick-pick cash amounts for the "By amount" field. */
const AMOUNT_PRESETS = [500, 1000, 2000, 5000];

export function ProductDetailActions({
    entryMode,
    onEntryModeChange,
    isFractional,
    qty,
    onQtyChange,
    step,
    decimals,
    unitLabel,
    amount,
    onAmountChange,
    derivedQty,
    previewAmount,
    canAdd,
    onAdd,
    onBuyNow,
    disabled,
}: ProductDetailActionsProps) {
    const amountMode = isFractional && entryMode === 'amount';

    return (
        <div className="mt-8 flex flex-col gap-4">
            {isFractional && (
                <Segmented<EntryMode>
                    value={entryMode}
                    onChange={onEntryModeChange}
                    options={[
                        { label: 'By weight', value: 'weight' },
                        { label: 'By amount', value: 'amount' },
                    ]}
                    className="self-start"
                />
            )}

            {amountMode ? (
                <div className="flex flex-col gap-2">
                    <AmountField
                        value={amount}
                        onChange={onAmountChange}
                        presets={AMOUNT_PRESETS}
                        disabled={disabled}
                        ariaLabel="Amount to spend"
                    />
                    <p className="text-xs text-text-3 tabular-nums">
                        {derivedQty > 0
                            ? `≈ ${formatQty(derivedQty, unitLabel)} · pay ${formatCurrency(amount)}`
                            : 'Enter an amount to spend'}
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-2 flex-wrap">
                    <QuantityField
                        value={qty}
                        onChange={onQtyChange}
                        step={step}
                        min={0}
                        decimals={decimals}
                        unitLabel={unitLabel}
                        dynamicStep
                        disabled={disabled}
                        ariaLabel="Quantity"
                    />
                    {isFractional && qty > 0 && (
                        <span className="text-xs text-text-3 tabular-nums">
                            ≈ pay {formatCurrency(previewAmount)}
                        </span>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={onAdd}
                    disabled={disabled || !canAdd}
                    className="flex-1"
                >
                    <ShoppingCart size={14} /> Add to cart
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={onBuyNow}
                    disabled={disabled || !canAdd}
                    className="flex-1"
                >
                    Buy now
                </Button>
            </div>
        </div>
    );
}
