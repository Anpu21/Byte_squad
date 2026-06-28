import { LuBadgeCheck } from 'react-icons/lu';
import { StarRating } from '@/components/ui';
import type { IProductReview } from '@/types';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/** One review in the public list. */
export function ReviewItem({ review }: { review: IProductReview }) {
    return (
        <div className="py-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <StarRating value={review.rating} size={13} />
                    <span className="text-[13px] font-medium text-text-1">
                        {review.reviewerName}
                    </span>
                    {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-text">
                            <LuBadgeCheck size={12} aria-hidden="true" />
                            Verified purchase
                        </span>
                    )}
                </div>
                <span className="whitespace-nowrap text-[11px] text-text-3">
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
    );
}
