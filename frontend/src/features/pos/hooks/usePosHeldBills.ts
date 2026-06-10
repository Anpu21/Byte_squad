import { useCallback, useEffect, useState } from 'react';
import type { IHeldBill } from '@/features/pos/types/held-bill.type';

const HELD_BILLS_STORAGE_KEY = 'ledgerpro_pos_held_bills';

export interface UsePosHeldBillsReturn {
    heldBills: IHeldBill[];
    /** Park a bill (newest first). */
    holdBill: (bill: Omit<IHeldBill, 'id' | 'heldAt'>) => void;
    /** Take a bill off the shelf — removes it and returns it (or null). */
    takeBill: (id: string) => IHeldBill | null;
    discardBill: (id: string) => void;
}

/**
 * Held (parked) bills for the POS — localStorage-backed like the live
 * cart, so a parked sale survives a refresh on the same terminal. The
 * BUSY-style swap flow (hold current ↔ resume another) is composed by
 * the page from `holdBill` + `takeBill`.
 */
export function usePosHeldBills(): UsePosHeldBillsReturn {
    const [heldBills, setHeldBills] = useState<IHeldBill[]>(() => {
        try {
            const saved = localStorage.getItem(HELD_BILLS_STORAGE_KEY);
            return saved ? (JSON.parse(saved) as IHeldBill[]) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(HELD_BILLS_STORAGE_KEY, JSON.stringify(heldBills));
    }, [heldBills]);

    const holdBill = useCallback<UsePosHeldBillsReturn['holdBill']>((bill) => {
        setHeldBills((prev) => [
            {
                ...bill,
                id: crypto.randomUUID(),
                heldAt: new Date().toISOString(),
            },
            ...prev,
        ]);
    }, []);

    const takeBill = useCallback(
        (id: string): IHeldBill | null => {
            const bill = heldBills.find((b) => b.id === id) ?? null;
            if (bill) {
                setHeldBills((prev) => prev.filter((b) => b.id !== id));
            }
            return bill;
        },
        [heldBills],
    );

    const discardBill = useCallback((id: string) => {
        setHeldBills((prev) => prev.filter((b) => b.id !== id));
    }, []);

    return { heldBills, holdBill, takeBill, discardBill };
}
