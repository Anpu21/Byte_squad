import api from './api';
import type {
    IApiResponse,
    ICreateReviewPayload,
    IModerationReview,
    IPagedModerationReviews,
    IProductReview,
    IReviewList,
    IUpdateReviewPayload,
    ReviewStatus,
} from '@/types';

interface ListReviewsParams {
    limit?: number;
    offset?: number;
}

interface ModerationListParams {
    productId?: string;
    status?: ReviewStatus;
    limit?: number;
    offset?: number;
}

export const reviewsService = {
    listForProduct: async (
        productId: string,
        params: ListReviewsParams = {},
    ): Promise<IReviewList> => {
        const response = await api.get<IApiResponse<IReviewList>>(
            `/shop/products/${productId}/reviews`,
            { params },
        );
        return response.data.data;
    },

    create: async (
        productId: string,
        payload: ICreateReviewPayload,
    ): Promise<IProductReview> => {
        const response = await api.post<IApiResponse<IProductReview>>(
            `/shop/products/${productId}/reviews`,
            payload,
        );
        return response.data.data;
    },

    update: async (
        reviewId: string,
        payload: IUpdateReviewPayload,
    ): Promise<IProductReview> => {
        const response = await api.patch<IApiResponse<IProductReview>>(
            `/shop/reviews/${reviewId}`,
            payload,
        );
        return response.data.data;
    },

    remove: async (reviewId: string): Promise<void> => {
        await api.delete(`/shop/reviews/${reviewId}`);
    },

    // ── Moderation (admin / manager) ──
    listForModeration: async (
        params: ModerationListParams = {},
    ): Promise<IPagedModerationReviews> => {
        const response = await api.get<IApiResponse<IPagedModerationReviews>>(
            '/admin/reviews',
            { params },
        );
        return response.data.data;
    },

    hide: async (
        reviewId: string,
        reason?: string,
    ): Promise<IModerationReview> => {
        const response = await api.patch<IApiResponse<IModerationReview>>(
            `/admin/reviews/${reviewId}/hide`,
            { reason },
        );
        return response.data.data;
    },

    unhide: async (reviewId: string): Promise<IModerationReview> => {
        const response = await api.patch<IApiResponse<IModerationReview>>(
            `/admin/reviews/${reviewId}/unhide`,
            {},
        );
        return response.data.data;
    },

    removeAsAdmin: async (reviewId: string): Promise<void> => {
        await api.delete(`/admin/reviews/${reviewId}`);
    },
};
