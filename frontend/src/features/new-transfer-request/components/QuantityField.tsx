interface QuantityFieldProps {
    value: string;
    onChange: (v: string) => void;
    error?: string;
}

export function QuantityField({ value, onChange, error }: QuantityFieldProps) {
    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2">
                Quantity needed
            </label>
            <input
                type="number"
                min={1}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-11 px-4 bg-canvas border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 ${
                    error ? 'border-danger' : 'border-border'
                }`}
                placeholder="e.g. 50"
            />
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
