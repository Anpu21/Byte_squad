import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { reviewsService } from '@/services/reviews.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ReviewStatus } from '@/types';

export interface ModerationFilters {
    productId?: string;
    status?: ReviewStatus;
    limit?: number;
    offset?: number;
}

function apiError(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string } | undefined)
            ?.message;
        if (msg) return msg;
    }
    return fallback;
}

/** Staff moderation: list reviews + hide / unhide / delete any. */
export function useReviewModeration(filters: ModerationFilters) {
    const queryClient = useQueryClient();

    const list = useQuery({
        queryKey: queryKeys.reviews.moderation(filters),
        queryFn: () => reviewsService.listForModeration(filters),
        placeholderData: (prev) => prev,
    });

    const invalidate = () =>
        void queryClient.invalidateQueries({
            queryKey: ['reviews', 'moderation'],
        });

    const hide = useMutation({
        mutationFn: (vars: { reviewId: string; reason?: string }) =>
            reviewsService.hide(vars.reviewId, vars.reason),
        onSuccess: () => {
            invalidate();
            toast.success('Review hidden');
        },
        onError: (err) => toast.error(apiError(err, 'Could not hide the review')),
    });

    const unhide = useMutation({
        mutationFn: (reviewId: string) => reviewsService.unhide(reviewId),
        onSuccess: () => {
            invalidate();
            toast.success('Review restored');
        },
        onError: (err) =>
            toast.error(apiError(err, 'Could not restore the review')),
    });

    const remove = useMutation({
        mutationFn: (reviewId: string) => reviewsService.removeAsAdmin(reviewId),
        onSuccess: () => {
            invalidate();
            toast.success('Review deleted');
        },
        onError: (err) =>
            toast.error(apiError(err, 'Could not delete the review')),
    });

    return { list, hide, unhide, remove };
}
