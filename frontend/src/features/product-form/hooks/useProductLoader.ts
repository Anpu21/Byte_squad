import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IProduct } from '@/types';
import type { ProductFormState } from './useProductFormState';

interface UseProductLoaderArgs {
    productId: string | undefined;
    form: ProductFormState;
    setImageUrl: (url: string | null) => void;
}

export function useProductLoader({
    productId,
    form,
    setImageUrl,
}: UseProductLoaderArgs) {
    const query = useQuery<IProduct>({
        queryKey: queryKeys.product.byId(productId ?? ''),
        queryFn: () => inventoryService.getProductById(productId ?? ''),
        enabled: Boolean(productId),
    });

    useEffect(() => {
        if (!query.data) return;
        const product = query.data;
        form.setName(product.name);
        form.setBarcode(product.barcode);
        form.setDescription(product.description || '');
        form.setCategory(product.category);
        form.setCostPrice(String(product.costPrice));
        form.setSellingPrice(String(product.sellingPrice));
        setImageUrl(product.imageUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.data]);

    useEffect(() => {
        if (query.error) {
            form.setErrors({ general: 'Failed to load product' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.error]);

    return { isLoading: query.isLoading && Boolean(productId) };
}
