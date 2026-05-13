import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { inventoryService } from '@/services/inventory.service';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface FormErrors {
    productId?: string;
    requestedQuantity?: string;
}

const PAGE_SIZE = 50;

export function useNewTransferRequestPage() {
    const navigate = useNavigate();

    const [productSearch, setProductSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [requestedQuantity, setRequestedQuantity] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: () => inventoryService.getProducts(),
        select: (list) => list.filter((p) => p.isActive),
    });

    const products = useMemo(
        () => productsQuery.data ?? [],
        [productsQuery.data],
    );
    const productsLoading = productsQuery.isLoading;

    const [lastSearch, setLastSearch] = useState(productSearch);
    if (productSearch !== lastSearch) {
        setLastSearch(productSearch);
        setVisibleCount(PAGE_SIZE);
    }

    const matchedProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return products;
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                p.barcode.toLowerCase().includes(term),
        );
    }, [products, productSearch]);

    const filteredProducts = useMemo(
        () => matchedProducts.slice(0, visibleCount),
        [matchedProducts, visibleCount],
    );

    const remainingCount = Math.max(0, matchedProducts.length - visibleCount);

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === selectedProductId) ?? null,
        [products, selectedProductId],
    );

    const showMore = () => setVisibleCount((n) => n + PAGE_SIZE);

    const goBack = () => navigate(FRONTEND_ROUTES.TRANSFERS);

    const validate = (): boolean => {
        const next: FormErrors = {};
        if (!selectedProductId) {
            next.productId = 'Please select a product';
        }
        const qty = parseInt(requestedQuantity, 10);
        if (!requestedQuantity || Number.isNaN(qty) || qty < 1) {
            next.requestedQuantity = 'Quantity must be 1 or more';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await stockTransfersService.create({
                productId: selectedProductId,
                requestedQuantity: parseInt(requestedQuantity, 10),
                requestReason: requestReason.trim() || undefined,
            });
            toast.success('Transfer request submitted');
            navigate(FRONTEND_ROUTES.TRANSFERS);
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to submit transfer request';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        productSearch,
        setProductSearch,
        productsLoading,
        filteredProducts,
        remainingCount,
        showMore,
        selectedProductId,
        setSelectedProductId,
        selectedProduct,
        requestedQuantity,
        setRequestedQuantity,
        requestReason,
        setRequestReason,
        errors,
        isSubmitting,
        handleSubmit,
        goBack,
    };
}
