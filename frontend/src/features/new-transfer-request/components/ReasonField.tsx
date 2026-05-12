interface ReasonFieldProps {
    value: string;
    onChange: (v: string) => void;
}

const MAX_LENGTH = 500;

export function ReasonField({ value, onChange }: ReasonFieldProps) {
    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2">
                Reason (optional)
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                maxLength={MAX_LENGTH}
                className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 resize-none"
                placeholder="Why does your branch need this transfer?"
            />
            <p className="text-[11px] text-text-3 mt-1">
                {value.length} / {MAX_LENGTH}
            </p>
        </div>
    );
}
