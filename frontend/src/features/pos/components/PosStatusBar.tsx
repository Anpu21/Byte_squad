interface PosStatusBarProps {
    scanStatus: string | null;
    pendingQty: number | null;
    onCancelPendingQty: () => void;
}

export default function PosStatusBar({
    scanStatus,
    pendingQty,
    onCancelPendingQty,
}: PosStatusBarProps) {
    if (!scanStatus && !pendingQty) return null;

    return (
        <div role="status" aria-live="polite" aria-atomic="true" className="contents">
            {scanStatus && (
                <div className="px-4 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text-1 font-medium animate-in fade-in duration-200">
                    {scanStatus}
                </div>
            )}
            {pendingQty && (
                <div className="px-4 py-2 bg-primary-soft border border-border-strong rounded-xl text-sm text-text-1 font-bold animate-in fade-in duration-200 flex items-center justify-between">
                    <span>
                        Quantity: {pendingQty}x — Now scan or select a product
                    </span>
                    <button
                        type="button"
                        onClick={onCancelPendingQty}
                        aria-label="Cancel pending quantity"
                        className="text-text-2 hover:text-text-1 text-xs underline"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
