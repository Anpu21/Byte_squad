import { Search } from 'lucide-react';

interface FilterSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function FilterSearch({ value, onChange }: FilterSearchProps) {
    return (
        <div>
            <label
                htmlFor="admin-inventory-search"
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
                    id="admin-inventory-search"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Name or barcode"
                    className="w-full h-9 pl-9 pr-3 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25 placeholder:text-text-3 transition-colors"
                />
            </div>
        </div>
    );
}
