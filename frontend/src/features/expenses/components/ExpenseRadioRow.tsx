interface ExpenseRadioRowProps {
    name: string;
    value: string;
    selected: boolean;
    label: string;
    count?: number;
    onChange: (value: string) => void;
}

export function ExpenseRadioRow({
    name,
    value,
    selected,
    label,
    count,
    onChange,
}: ExpenseRadioRowProps) {
    return (
        <label
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                selected
                    ? 'bg-accent-soft text-accent-text'
                    : 'text-text-1 hover:bg-surface-2'
            }`}
        >
            <input
                type="radio"
                name={name}
                value={value}
                checked={selected}
                onChange={() => onChange(value)}
                style={{ accentColor: 'var(--accent)' }}
            />
            <span className="truncate">{label}</span>
            {count !== undefined && (
                <span
                    className={`ml-auto text-[11px] mono ${
                        selected ? 'text-accent-text/70' : 'text-text-3'
                    }`}
                >
                    {count}
                </span>
            )}
        </label>
    );
}
