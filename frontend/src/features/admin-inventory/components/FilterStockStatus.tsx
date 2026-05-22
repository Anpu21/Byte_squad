import type { StockKey } from '../types/stock-key.type';
import { STOCK_OPTIONS } from '../constants';
import { FilterRadioList } from './FilterRadioList';

interface FilterStockStatusProps {
    selected: '' | StockKey;
    onChange: (value: '' | StockKey) => void;
}

export function FilterStockStatus({ selected, onChange }: FilterStockStatusProps) {
    return (
        <FilterRadioList
            title="Stock status"
            name="stock-status"
            options={STOCK_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={selected}
            onChange={(v) => onChange(v as '' | StockKey)}
        />
    );
}
