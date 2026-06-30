import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { heldSalesService } from '@/services/held-sales.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IHeldSale, IHeldSalePayload } from '@/types';
import type {
    IHeldBill,
    IHeldSaleSnapshot,
} from '@/features/pos/types/held-bill.type';

export interface UsePosHeldBillsReturn {
    heldBills: IHeldBill[];
    /** Park a bill on the branch shelf. */
    holdBill: (bill: Omit<IHeldBill, 'id' | 'heldAt'>) => void;
    /**
     * Take a bill off the shelf — returns it from the loaded list (snapshot
     * included) and removes it server-side so it can't be resumed twice.
     */
    takeBill: (id: string) => IHeldBill | null;
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

    const { mutate: holdMutate } = useMutation({
        mutationFn: (payload: IHeldSalePayload) =>
            heldSalesService.hold(payload),
        onSuccess: invalidate,
    });
    const { mutate: discardMutate } = useMutation({
        mutationFn: (id: string) => heldSalesService.discard(id),
        onSuccess: invalidate,
    });

    const holdBill = useCallback<UsePosHeldBillsReturn['holdBill']>(
        (bill) => holdMutate(toPayload(bill)),
        [holdMutate],
    );

    const takeBill = useCallback(
        (id: string): IHeldBill | null => {
            const bill = heldBills.find((b) => b.id === id) ?? null;
            if (bill) discardMutate(id);
            return bill;
        },
        [heldBills, discardMutate],
    );

    const discardBill = useCallback(
        (id: string) => discardMutate(id),
        [discardMutate],
    );

    return { heldBills, holdBill, takeBill, discardBill };
}
