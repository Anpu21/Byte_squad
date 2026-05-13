import { useLoyaltyHistory } from '../hooks/useLoyaltyHistory';
import { LoyaltyHistoryRow } from './LoyaltyHistoryRow';
import { LoyaltyEmpty } from './LoyaltyEmpty';

export function LoyaltyHistoryList() {
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useLoyaltyHistory();

    if (isLoading) {
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

    const entries = data?.pages.flatMap((page) => page.entries) ?? [];

    if (entries.length === 0) {
        return <LoyaltyEmpty />;
    }

    return (
        <section>
            <h2 className="text-sm font-semibold text-text-1 mb-3">Activity</h2>
            <div className="bg-surface border border-border rounded-md px-4">
                {entries.map((entry) => (
                    <LoyaltyHistoryRow key={entry.id} entry={entry} />
                ))}
            </div>
            {hasNextPage && (
                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="h-9 px-4 text-[13px] font-medium rounded-md bg-surface text-text-1 border border-border-strong hover:bg-surface-2 transition-colors disabled:opacity-50"
                    >
                        {isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </section>
    );
}
