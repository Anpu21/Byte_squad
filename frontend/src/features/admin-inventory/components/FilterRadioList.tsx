interface FilterRadioOption {
    value: string;
    label: string;
}

interface FilterRadioListProps {
    title: string;
    name: string;
    options: FilterRadioOption[];
    selected: string;
    onChange: (value: string) => void;
    scrollable?: boolean;
    emptyLabel?: string;
}

export function FilterRadioList({
    title,
    name,
    options,
    selected,
    onChange,
    scrollable = false,
    emptyLabel,
}: FilterRadioListProps) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                {title}
            </p>
            <div
                className={`flex flex-col gap-1 ${
                    scrollable ? 'max-h-64 overflow-y-auto' : ''
                }`}
            >
                {options.map((opt) => {
                    const isSelected = selected === opt.value;
                    return (
                        <label
                            key={opt.value || `${name}-all`}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                isSelected
                                    ? 'bg-accent-soft text-accent-text'
                                    : 'text-text-1 hover:bg-surface-2'
                            }`}
                        >
                            <input
                                type="radio"
                                name={name}
                                value={opt.value}
                                checked={isSelected}
                                onChange={() => onChange(opt.value)}
                                style={{ accentColor: 'var(--accent)' }}
                            />
                            <span className="truncate">{opt.label}</span>
                        </label>
                    );
                })}
                {options.length === 0 && emptyLabel && (
                    <p className="text-xs text-text-3 px-2 py-1">{emptyLabel}</p>
                )}
            </div>
        </div>
    );
}
