import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { reviewsService } from '@/services/reviews.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ICreateReviewPayload, IUpdateReviewPayload } from '@/types';

function apiError(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string } | undefined)
            ?.message;
        if (msg) return msg;
    }
    return fallback;
}

/**
 * Create / edit / delete the customer's own review. Each success refreshes the
 * reviews list, the product-detail header stars, and the catalog cards.
 */
export function useReviewMutations(productId: string) {
    const queryClient = useQueryClient();

    const invalidate = () => {
        void queryClient.invalidateQueries({
            queryKey: queryKeys.reviews.byProduct(productId),
        });
        void queryClient.invalidateQueries({
            queryKey: ['shop', 'public-product', productId],
        });
        void queryClient.invalidateQueries({ queryKey: ['shop', 'products'] });
    };

    const createReview = useMutation({
        mutationFn: (payload: ICreateReviewPayload) =>
            reviewsService.create(productId, payload),
        onSuccess: () => {
            invalidate();
            toast.success('Review posted');
        },
        onError: (err) => toast.error(apiError(err, 'Could not post your review')),
    });

    const updateReview = useMutation({
        mutationFn: (vars: { reviewId: string; payload: IUpdateReviewPayload }) =>
            reviewsService.update(vars.reviewId, vars.payload),
        onSuccess: () => {
            invalidate();
            toast.success('Review updated');
        },
        onError: (err) =>
            toast.error(apiError(err, 'Could not update your review')),
    });

    const deleteReview = useMutation({
        mutationFn: (reviewId: string) => reviewsService.remove(reviewId),
        onSuccess: () => {
            invalidate();
            toast.success('Review deleted');
        },
        onError: (err) =>
            toast.error(apiError(err, 'Could not delete your review')),
    });

    return { createReview, updateReview, deleteReview };
}
