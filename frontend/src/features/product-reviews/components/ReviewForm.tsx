import { useState } from 'react';
import { Button, FIELD_SHELL, FIELD_BORDER, StarRating } from '@/components/ui';
import type { ICreateReviewPayload, IProductReview } from '@/types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} w-full px-3 py-2`;

interface ReviewFormProps {
    initial?: IProductReview | null;
    submitting: boolean;
    onSubmit: (payload: ICreateReviewPayload) => void;
    onCancel?: () => void;
}

/** Create / edit the customer's own review. Rating (1–5) is required. */
export function ReviewForm({
    initial,
    submitting,
    onSubmit,
    onCancel,
}: ReviewFormProps) {
    const [rating, setRating] = useState(initial?.rating ?? 0);
    const [title, setTitle] = useState(initial?.title ?? '');
    const [comment, setComment] = useState(initial?.comment ?? '');
    const canSubmit = rating >= 1 && !submitting;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmit) return;
                onSubmit({
                    rating,
                    title: title.trim() || undefined,
                    comment: comment.trim() || undefined,
                });
            }}
            className="space-y-3 rounded-xl border border-border bg-surface p-4"
        >
            <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-text-2">
                    Your rating
                </span>
                <StarRating
                    value={rating}
                    readOnly={false}
                    size={22}
                    onChange={setRating}
                />
            </div>
            <input
                className={INPUT_CLASS}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Title (optional)"
                aria-label="Review title"
            />
            <textarea
                className={`${INPUT_CLASS} resize-y`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Share your experience (optional)"
                aria-label="Review comment"
            />
            <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" disabled={!canSubmit}>
                    {submitting
                        ? 'Saving…'
                        : initial
                          ? 'Update review'
                          : 'Submit review'}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
