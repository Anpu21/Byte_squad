import { LuBadgeCheck } from 'react-icons/lu';
import Avatar from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui';
import type { IProductReview } from '@/types';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/** One review in the public list — avatar, identity, rating, then the body. */
export function ReviewItem({ review }: { review: IProductReview }) {
    return (
        <div className="flex gap-3 py-4">
            <Avatar name={review.reviewerName} size={38} />
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[13px] font-semibold text-text-1">
                                {review.reviewerName}
                            </span>
                            {review.isVerifiedPurchase && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-medium text-accent-text">
                                    <LuBadgeCheck size={11} aria-hidden="true" />
                                    Verified
                                </span>
                            )}
                        </div>
                        <div className="mt-1">
                            <StarRating value={review.rating} size={13} />
                        </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-[11px] text-text-3">
                        {formatDate(review.createdAt)}
                    </span>
                </div>
                {review.title && (
                    <p className="mt-2 text-[13px] font-semibold text-text-1">
                        {review.title}
                    </p>
                )}
                {review.comment && (
                    <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-text-2">
                        {review.comment}
                    </p>
                )}
            </div>
        </div>
    );
}
