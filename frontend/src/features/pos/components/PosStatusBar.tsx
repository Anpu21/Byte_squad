interface PosStatusBarProps {
    scanStatus: string | null;
}

export function PosStatusBar({ scanStatus }: PosStatusBarProps) {
    if (!scanStatus) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="px-4 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text-1 font-medium animate-in fade-in duration-200"
        >
            {scanStatus}
        </div>
    );
}
