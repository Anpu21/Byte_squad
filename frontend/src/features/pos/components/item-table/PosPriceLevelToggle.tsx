import type { TPriceLevel } from '@/types';
import Segmented from '@/components/ui/Segmented';

interface IPosPriceLevelToggleProps {
    value: TPriceLevel;
    onChange: (next: TPriceLevel) => void;
    className?: string;
}

const OPTIONS: { label: string; value: TPriceLevel }[] = [
    { label: 'Retail', value: 'Retail' },
    { label: 'Wholesale', value: 'Wholesale' },
];

/**
 * Two-option pill toggle that flips the cart between retail and wholesale
 * pricing. The cashier sees both prices in the search results — the toggle
 * decides which one a new line uses when added. Already-staged rows keep
 * the price they were rung at.
 */
export function PosPriceLevelToggle({
    value,
    onChange,
    className,
}: IPosPriceLevelToggleProps) {
    return (
        <Segmented<TPriceLevel>
            value={value}
            options={OPTIONS}
            onChange={onChange}
            className={className}
        />
    );
}
