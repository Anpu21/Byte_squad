import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { inventoryService } from '@/services/inventory.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import type { IInventoryWithProduct } from '@/types';

export function useInventoryDelete() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const mutation = useMutation({
        mutationFn: inventoryService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.all(),
            });
        },
    });

    return async (item: IInventoryWithProduct): Promise<boolean> => {
        const ok = await confirm({
            title: 'Delete product?',
            body: `Permanently delete "${item.product.name}". This cannot be undone.`,
            confirmLabel: 'Delete product',
            tone: 'danger',
        });
        if (!ok) return false;
        try {
            await mutation.mutateAsync(item.productId);
            toast.success('Product deleted');
            return true;
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to delete product';
            toast.error(message);
            return false;
        }
    };
}
