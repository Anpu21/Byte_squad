import { LuStar } from 'react-icons/lu';
import { StarRating } from '@/components/ui';
import type { IReviewSummary } from '@/types';

const STARS = [5, 4, 3, 2, 1] as const;

/** Aggregate rating block: big average + star scale + per-level bars. */
export function ReviewSummary({ summary }: { summary: IReviewSummary }) {
    const { average, count, distribution } = summary;
    return (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="shrink-0 text-center sm:w-40">
                <div className="text-4xl font-bold tabular-nums text-text-1">
                    {average.toFixed(1)}
                </div>
                <div className="mt-1 flex justify-center">
                    <StarRating value={average} size={16} />
                </div>
                <div className="mt-1 text-[12px] text-text-3">
                    {count} review{count === 1 ? '' : 's'}
                </div>
            </div>
            <div className="flex-1 space-y-1.5">
                {STARS.map((star) => {
                    const n =
                        distribution[
                            String(star) as keyof IReviewSummary['distribution']
                        ] ?? 0;
                    const pct = count > 0 ? (n / count) * 100 : 0;
                    return (
                        <div key={star} className="flex items-center gap-2">
                            <span className="inline-flex w-7 items-center gap-0.5 text-[12px] tabular-nums text-text-3">
                                {star}
                                <LuStar
                                    size={10}
                                    className="fill-warning text-warning"
                                    aria-hidden="true"
                                />
                            </span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                                <div
                                    className="h-full rounded-full bg-warning"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="w-8 text-right text-[12px] tabular-nums text-text-3">
                                {n}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
