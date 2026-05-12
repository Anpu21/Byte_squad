interface StatementRowProps {
    label: string;
    value: string;
    bold?: boolean;
    dim?: boolean;
}

export function StatementRow({
    label,
    value,
    bold,
    dim,
}: StatementRowProps) {
    return (
        <div className="px-5 py-2 flex items-center justify-between">
            <span
                className={`text-[13px] ${
                    bold
                        ? 'font-semibold text-text-1'
                        : dim
                          ? 'text-text-3'
                          : 'text-text-2'
                }`}
            >
                {label}
            </span>
            <span
                className={`mono text-[13px] ${
                    bold
                        ? 'font-semibold text-text-1'
                        : dim
                          ? 'text-text-3'
                          : 'text-text-1'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
