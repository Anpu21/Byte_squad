import { ScrollText } from 'lucide-react';

export function MyRequestsEmpty() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
                <ScrollText size={22} className="text-text-2" />
            </div>
            <p className="text-sm font-semibold text-text-1">No requests yet</p>
            <p className="text-xs text-text-3 mt-1">
                Your pickup requests will appear here once you check out.
            </p>
        </div>
    );
}
