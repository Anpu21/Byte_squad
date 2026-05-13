interface CategoryChipsProps {
    categories: string[];
    value: string;
    onChange: (value: string) => void;
}

export function CategoryChips({
    categories,
    value,
    onChange,
}: CategoryChipsProps) {
    if (categories.length === 0) return null;

    const chips: { label: string; value: string }[] = [
        { label: 'All', value: '' },
        ...categories.map((c) => ({ label: c, value: c })),
    ];

    return (
        <nav
            aria-label="Product categories"
            className="-mx-4 sm:mx-0 mb-6 overflow-x-auto"
        >
            <ul className="flex items-center gap-2 px-4 sm:px-0 sm:flex-wrap">
                {chips.map((chip) => {
                    const active = chip.value === value;
                    return (
                        <li key={chip.value || '__all'} className="flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => onChange(chip.value)}
                                aria-pressed={active}
                                className={`h-8 px-3 text-xs font-medium rounded-full transition-colors ${
                                    active
                                        ? 'bg-primary text-text-inv'
                                        : 'bg-surface-2 text-text-2 hover:bg-surface border border-border'
                                }`}
                            >
                                {chip.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
