import { LuSearch as Search } from 'react-icons/lu';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

interface FilterSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function FilterSearch({ value, onChange }: FilterSearchProps) {
    return (
        <div>
            <label
                htmlFor="inventory-list-search"
                className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2 block"
            >
                Search
            </label>
            <div className="relative">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                />
                <input
                    id="inventory-list-search"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Name or barcode"
                    className={`${FIELD_SHELL} ${FIELD_BORDER} w-full h-9 pl-9 pr-3`}
                />
            </div>
        </div>
    );
}
