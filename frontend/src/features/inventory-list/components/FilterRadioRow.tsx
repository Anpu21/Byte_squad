interface FilterRadioRowProps {
    name: string;
    value: string;
    selected: boolean;
    label: string;
    onChange: (value: string) => void;
}

export function FilterRadioRow({
    name,
    value,
    selected,
    label,
    onChange,
}: FilterRadioRowProps) {
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
        </label>
    );
}
