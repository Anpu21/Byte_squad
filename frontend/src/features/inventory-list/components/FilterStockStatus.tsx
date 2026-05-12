import { STOCK_OPTIONS } from '../lib/stock-key';
import { FilterRadioRow } from './FilterRadioRow';

interface FilterStockStatusProps {
    selected: string;
    onChange: (value: string) => void;
}

export function FilterStockStatus({ selected, onChange }: FilterStockStatusProps) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                Stock status
            </p>
            <div className="flex flex-col gap-1">
                {STOCK_OPTIONS.map((opt) => (
                    <FilterRadioRow
                        key={opt.value || 'all'}
                        name="stock-status"
                        value={opt.value}
                        selected={selected === opt.value}
                        label={opt.label}
                        onChange={onChange}
                    />
                ))}
            </div>
        </div>
    );
}
