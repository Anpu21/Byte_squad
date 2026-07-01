import { LuStar } from 'react-icons/lu';
import { StarRating } from '@/components/ui';
import type { IReviewSummary } from '@/types';

const STARS = [5, 4, 3, 2, 1] as const;

/** Aggregate rating block: big average + star scale on the left, per-level
 *  distribution bars on the right (split by a divider on wider screens). */
export function ReviewSummary({ summary }: { summary: IReviewSummary }) {
    const { average, count, distribution } = summary;
    return (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="shrink-0 text-center sm:w-40 sm:border-r sm:border-border sm:pr-8">
                <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-bold leading-none tabular-nums text-text-1">
                        {average.toFixed(1)}
                    </span>
                    <span className="mb-1 text-sm font-medium text-text-3">
                        / 5
                    </span>
                </div>
                <div className="mt-2 flex justify-center">
                    <StarRating value={average} size={16} />
                </div>
                <div className="mt-1.5 text-[12px] text-text-3">
                    {count} review{count === 1 ? '' : 's'}
                </div>
            </div>
            <div className="flex-1 space-y-2">
                {STARS.map((star) => {
                    const n =
                        distribution[
                            String(star) as keyof IReviewSummary['distribution']
                        ] ?? 0;
                    const pct = count > 0 ? (n / count) * 100 : 0;
                    return (
                        <div key={star} className="flex items-center gap-2.5">
                            <span className="w-3 text-right text-[12px] tabular-nums text-text-2">
                                {star}
                            </span>
                            <LuStar
                                size={11}
                                className="shrink-0 fill-warning text-warning"
                                aria-hidden="true"
                            />
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                                <div
                                    className="h-full rounded-full bg-warning transition-[width] duration-500 ease-out"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="w-7 text-right text-[12px] tabular-nums text-text-3">
                                {n}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
