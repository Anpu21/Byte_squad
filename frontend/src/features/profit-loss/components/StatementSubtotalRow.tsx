interface StatementSubtotalRowProps {
    label: string;
    value: string;
    trailing?: string;
    emphasize?: boolean;
    positive?: boolean;
}

export function StatementSubtotalRow({
    label,
    value,
    trailing,
    emphasize,
    positive = true,
}: StatementSubtotalRowProps) {
    return (
        <div
            className={`px-5 py-3.5 flex items-center justify-between ${
                emphasize ? 'bg-primary-soft' : 'bg-surface-2'
            }`}
        >
            <span
                className={`${
                    emphasize ? 'text-base' : 'text-[14px]'
                } font-semibold text-text-1`}
            >
                {label}
            </span>
            <div className="text-right">
                <span
                    className={`mono ${
                        emphasize ? 'text-base' : 'text-[14px]'
                    } font-bold ${
                        emphasize && !positive
                            ? 'text-danger'
                            : 'text-text-1'
                    }`}
                >
                    {value}
                </span>
                {trailing && (
                    <span className="text-[11px] text-text-3 ml-2">
                        {trailing}
                    </span>
                )}
            </div>
        </div>
    );
}
