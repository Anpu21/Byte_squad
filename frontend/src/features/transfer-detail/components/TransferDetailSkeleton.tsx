export function TransferDetailSkeleton() {
    return (
        <div className="animate-in fade-in duration-300">
            <div className="h-8 w-48 bg-surface-2 rounded animate-pulse mb-6" />
            <div className="bg-surface border border-border rounded-md p-6 space-y-4">
                <div className="h-6 w-64 bg-surface-2 rounded animate-pulse" />
                <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-surface-2 rounded animate-pulse" />
            </div>
        </div>
    );
}
