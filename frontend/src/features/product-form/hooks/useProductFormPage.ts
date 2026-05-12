import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useScanDetection } from '@/hooks/useScanDetection';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useProductFormState } from './useProductFormState';
import { useProductLoader } from './useProductLoader';
import { useBarcodeLookup } from './useBarcodeLookup';
import { useProductImage } from './useProductImage';
import { useProductSubmit } from './useProductSubmit';
import { computePriceDerived } from '../lib/price-math';
import { BARCODE_SCAN_MIN_LENGTH } from '../lib/constants';

export function useProductFormPage() {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const { user } = useAuth();
    const isEditMode = Boolean(productId);

    const form = useProductFormState();
    const image = useProductImage({ productId, isEditMode });
    const loader = useProductLoader({
        productId,
        form,
        setImageUrl: image.setImageUrl,
    });
    const lookupBarcode = useBarcodeLookup({ isEditMode, form });
    const submit = useProductSubmit({
        form,
        isEditMode,
        productId,
        branchId: user?.branchId,
        pendingImageFile: image.pendingImageFile,
        onSuccess: () => navigate(FRONTEND_ROUTES.INVENTORY),
    });

    const categoriesQuery = useQuery({
        queryKey: queryKeys.inventory.categories(),
        queryFn: inventoryService.getCategories,
        staleTime: 10 * 60_000,
    });

    const [showCameraScanner, setShowCameraScanner] = useState(false);

    useScanDetection({
        onScan: lookupBarcode,
        minLength: BARCODE_SCAN_MIN_LENGTH,
    });

    const priceDerived = computePriceDerived(form.costPrice, form.sellingPrice);

    return {
        navigate,
        isEditMode,
        isLoadingProduct: loader.isLoading,
        form,
        image,
        categories: categoriesQuery.data ?? [],
        lookupBarcode,
        priceDerived,
        isSubmitting: submit.isSubmitting,
        handleSubmit: submit.handleSubmit,
        showCameraScanner,
        setShowCameraScanner,
    };
}
