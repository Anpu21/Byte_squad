import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { heldSalesService } from '@/services/held-sales.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IHeldSale, IHeldSalePayload } from '@/types';
import type {
    IHeldBill,
    IHeldSaleSnapshot,
} from '@/features/pos/types/held-bill.type';

export interface UsePosHeldBillsReturn {
    heldBills: IHeldBill[];
    /** Park a bill on the branch shelf. Resolves once the server confirms. */
    holdBill: (bill: Omit<IHeldBill, 'id' | 'heldAt'>) => Promise<void>;
    /**
     * Take a bill off the shelf — removes it server-side FIRST, then returns
     * the snapshot only if the delete succeeded. Returns null (and toasts) on
     * failure so a bill still resumable elsewhere is never loaded into a cart.
     */
    takeBill: (id: string) => Promise<IHeldBill | null>;
    discardBill: (id: string) => void;
}

function toHeldBill(sale: IHeldSale): IHeldBill {
    const snap = sale.snapshot as IHeldSaleSnapshot;
    return {
        id: sale.id,
        heldAt: sale.createdAt,
        label: sale.label,
        heldByName: sale.heldByName,
        items: snap.items,
        cartDiscountPercentage: snap.cartDiscountPercentage,
        loyaltyOwner: snap.loyaltyOwner,
        loyaltyRedeemPoints: snap.loyaltyRedeemPoints,
        creditAccount: snap.creditAccount ?? null,
        creditOverride: snap.creditOverride ?? null,
    };
}

function toPayload(bill: Omit<IHeldBill, 'id' | 'heldAt'>) {
    return {
        label: bill.label,
        itemCount: bill.items.length,
        total: bill.items.reduce((sum, item) => sum + item.lineTotal, 0),
        snapshot: {
            items: bill.items,
            cartDiscountPercentage: bill.cartDiscountPercentage,
            loyaltyOwner: bill.loyaltyOwner,
            loyaltyRedeemPoints: bill.loyaltyRedeemPoints,
            creditAccount: bill.creditAccount,
            creditOverride: bill.creditOverride,
        },
    };
}

/**
 * Held (parked) bills for the POS — persisted server-side so a bill parked
 * on one terminal can be recalled on any other in the branch, and a
 * supervisor can see who parked each one. The BUSY-style swap flow (hold
 * current ↔ resume another) is composed by the page from `holdBill` +
 * `takeBill`.
 */
export function usePosHeldBills(): UsePosHeldBillsReturn {
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: queryKeys.heldSales.all(),
        queryFn: heldSalesService.list,
        staleTime: 10_000,
    });
    const heldBills = useMemo(() => (data ?? []).map(toHeldBill), [data]);

    const invalidate = () =>
        void queryClient.invalidateQueries({
            queryKey: queryKeys.heldSales.all(),
        });

    const { mutateAsync: holdMutateAsync } = useMutation({
        mutationFn: (payload: IHeldSalePayload) =>
            heldSalesService.hold(payload),
        onSuccess: invalidate,
    });
    const { mutateAsync: discardMutateAsync } = useMutation({
        mutationFn: (id: string) => heldSalesService.discard(id),
        onSuccess: invalidate,
    });

    const holdBill = useCallback<UsePosHeldBillsReturn['holdBill']>(
        async (bill) => {
            await holdMutateAsync(toPayload(bill));
        },
        [holdMutateAsync],
    );

    const takeBill = useCallback<UsePosHeldBillsReturn['takeBill']>(
        async (id) => {
            const bill = heldBills.find((b) => b.id === id) ?? null;
            if (!bill) return null;
            try {
                // Remove server-side BEFORE handing the snapshot back, so a
                // failed delete can't leave the bill both in a cart and on the
                // shelf (double-sell across terminals).
                await discardMutateAsync(id);
                return bill;
            } catch {
                toast.error('Could not resume — the bill is still on the shelf');
                return null;
            }
        },
        [heldBills, discardMutateAsync],
    );

    const discardBill = useCallback(
        (id: string) => {
            void discardMutateAsync(id).catch(() =>
                toast.error('Could not discard the bill'),
            );
        },
        [discardMutateAsync],
    );

    return { heldBills, holdBill, takeBill, discardBill };
}
