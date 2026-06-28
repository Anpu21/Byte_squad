import { Button } from '@/components/ui';
import type { IProductReview } from '@/types';
import { ReviewItem } from './ReviewItem';

interface ReviewListProps {
    items: IProductReview[];
    page: number;
    pageCount: number;
    onPage: (page: number) => void;
}

/** Paginated list of other customers' reviews. */
export function ReviewList({ items, page, pageCount, onPage }: ReviewListProps) {
    return (
        <div>
            <div className="divide-y divide-border">
                {items.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                ))}
            </div>
            {pageCount > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <span className="text-xs text-text-3">
                        Page {page + 1} of {pageCount}
                    </span>
                    <div className="flex gap-1.5">
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={page === 0}
                            onClick={() => onPage(page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={page + 1 >= pageCount}
                            onClick={() => onPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
