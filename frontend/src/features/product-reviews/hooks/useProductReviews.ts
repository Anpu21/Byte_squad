import { useQuery } from '@tanstack/react-query';
import { reviewsService } from '@/services/reviews.service';
import { queryKeys } from '@/lib/queryKeys';

export const REVIEWS_PAGE_SIZE = 5;

/** A page of a product's reviews + aggregate + the caller's own review. */
export function useProductReviews(productId: string, page: number) {
    const params = {
        limit: REVIEWS_PAGE_SIZE,
        offset: page * REVIEWS_PAGE_SIZE,
    };
    return useQuery({
        queryKey: queryKeys.reviews.forProduct(productId, params),
        queryFn: () => reviewsService.listForProduct(productId, params),
        enabled: Boolean(productId),
        placeholderData: (prev) => prev,
    });
}
