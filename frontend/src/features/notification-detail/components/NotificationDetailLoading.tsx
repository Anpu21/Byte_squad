export function NotificationDetailLoading() {
    return (
        <div className="bg-surface border border-border rounded-md p-10">
            <div className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-surface-2" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-2 rounded w-2/3" />
                    <div className="h-3 bg-surface-2 rounded w-1/3" />
                </div>
            </div>
            <div className="mt-8 space-y-3 animate-pulse">
                <div className="h-3 bg-surface-2 rounded w-full" />
                <div className="h-3 bg-surface-2 rounded w-11/12" />
                <div className="h-3 bg-surface-2 rounded w-9/12" />
            </div>
        </div>
    );
}
