import { useState } from 'react';
import { Button, StarRating } from '@/components/ui';
import { useConfirm } from '@/hooks/useConfirm';
import type { ICreateReviewPayload } from '@/types';
import {
    REVIEWS_PAGE_SIZE,
    useProductReviews,
} from '../hooks/useProductReviews';
import { useReviewMutations } from '../hooks/useReviewMutations';
import { ReviewSummary } from './ReviewSummary';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';

/** Ratings & reviews for a storefront product — read + own-review CRUD. */
export function ProductReviewsSection({ productId }: { productId: string }) {
    const [page, setPage] = useState(0);
    const [editing, setEditing] = useState(false);
    const { data, isLoading } = useProductReviews(productId, page);
    const { createReview, updateReview, deleteReview } =
        useReviewMutations(productId);
    const confirm = useConfirm();

    if (isLoading && !data) {
        return (
            <section className="mt-12 border-t border-border pt-8">
                <h2 className="text-lg font-bold text-text-1">
                    Ratings &amp; reviews
                </h2>
                <p className="mt-4 text-[13px] text-text-3">Loading reviews…</p>
            </section>
        );
    }
    if (!data) return null;

    const { summary, items, total, myReview, eligibility } = data;
    const pageCount = Math.max(Math.ceil(total / REVIEWS_PAGE_SIZE), 1);
    const others = myReview
        ? items.filter((r) => r.id !== myReview.id)
        : items;

    const handleCreate = (payload: ICreateReviewPayload) =>
        createReview.mutate(payload, { onSuccess: () => setEditing(false) });
    const handleUpdate = (payload: ICreateReviewPayload) => {
        if (!myReview) return;
        updateReview.mutate(
            { reviewId: myReview.id, payload },
            { onSuccess: () => setEditing(false) },
        );
    };
    const handleDelete = async () => {
        if (!myReview) return;
        const ok = await confirm({
            title: 'Delete your review?',
            body: 'This permanently removes your rating and comment.',
            confirmLabel: 'Delete',
            tone: 'danger',
        });
        if (ok) deleteReview.mutate(myReview.id);
    };

    return (
        <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-bold text-text-1">
                Ratings &amp; reviews
            </h2>

            <div className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <ReviewSummary summary={summary} />
            </div>

            <div className="mt-5">
                {myReview && !editing ? (
                    <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <StarRating value={myReview.rating} size={14} />
                                <span className="text-[12px] font-semibold text-accent-text">
                                    Your review
                                </span>
                            </div>
                            <div className="flex gap-1.5">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setEditing(true)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={handleDelete}
                                    disabled={deleteReview.isPending}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                        {myReview.title && (
                            <p className="mt-2 text-[13px] font-semibold text-text-1">
                                {myReview.title}
                            </p>
                        )}
                        {myReview.comment && (
                            <p className="mt-1 whitespace-pre-line text-[13px] text-text-2">
                                {myReview.comment}
                            </p>
                        )}
                    </div>
                ) : myReview && editing ? (
                    <ReviewForm
                        initial={myReview}
                        submitting={updateReview.isPending}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                    />
                ) : eligibility.canReview ? (
                    <ReviewForm
                        submitting={createReview.isPending}
                        onSubmit={handleCreate}
                    />
                ) : !eligibility.hasPurchased ? (
                    <p className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-[13px] text-text-3">
                        Only verified buyers can review this product.
                    </p>
                ) : null}
            </div>

            <div className="mt-6">
                {others.length > 0 ? (
                    <ReviewList
                        items={others}
                        page={page}
                        pageCount={pageCount}
                        onPage={setPage}
                    />
                ) : total === 0 ? (
                    <p className="py-6 text-center text-[13px] text-text-3">
                        No reviews yet — be the first to review this product.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
