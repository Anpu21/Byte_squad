import { useEffect, useState } from 'react';
import { useLoyaltyHistory } from '../hooks/useLoyaltyHistory';
import { LoyaltyHistoryRow } from './LoyaltyHistoryRow';
import { LoyaltyEmpty } from './LoyaltyEmpty';
import type { ILoyaltyHistoryEntry } from '@/types';

export function LoyaltyHistoryList() {
    const { data, isLoading, isError, loadMore, pageSize } = useLoyaltyHistory();
    const [accumulated, setAccumulated] = useState<ILoyaltyHistoryEntry[]>([]);

    useEffect(() => {
        if (!data) return;
        setAccumulated((prev) => {
            if (data.offset === 0) return data.entries;
            // Append, dedupe by id.
            const seen = new Set(prev.map((e) => e.id));
            const merged = [...prev];
            for (const entry of data.entries) {
                if (!seen.has(entry.id)) merged.push(entry);
            }
            return merged;
        });
    }, [data]);

    if (isLoading && accumulated.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-danger-soft border border-danger/40 text-danger rounded-md p-4 text-sm">
                Could not load your rewards activity. Try again later.
            </div>
        );
    }

    if (accumulated.length === 0) {
        return <LoyaltyEmpty />;
    }

    const hasMore =
        data !== undefined && data.offset + pageSize < data.total;

    return (
        <section>
            <h2 className="text-sm font-semibold text-text-1 mb-3">Activity</h2>
            <div className="bg-surface border border-border rounded-md px-4">
                {accumulated.map((entry) => (
                    <LoyaltyHistoryRow key={entry.id} entry={entry} />
                ))}
            </div>
            {hasMore && (
                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={loadMore}
                        className="h-9 px-4 text-[13px] font-medium rounded-md bg-surface text-text-1 border border-border-strong hover:bg-surface-2 transition-colors"
                    >
                        Load more
                    </button>
                </div>
            )}
        </section>
    );
}
