interface TransferBoardHeaderProps {
    total: number;
}

export function TransferBoardHeader({ total }: TransferBoardHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Stock Transfers
                </h1>
                <p className="text-sm text-text-3 mt-1">
                    {total} transfer{total === 1 ? '' : 's'} across the
                    pipeline. Drag a card between columns to act on it, or
                    click to open the details.
                </p>
            </div>
        </div>
    );
}
