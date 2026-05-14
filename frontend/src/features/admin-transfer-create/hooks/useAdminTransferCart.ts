import { useCallback, useMemo, useState } from 'react';
import type { IProduct } from '@/types';
import type { TransferCartLine } from '../types/transfer-cart-line.type';

export function useAdminTransferCart() {
    const [lines, setLines] = useState<TransferCartLine[]>([]);

    const addToCart = useCallback((product: IProduct, qty = 1) => {
        setLines((prev) => {
            const existing = prev.find(
                (line) => line.product.id === product.id,
            );
            if (existing) {
                return prev.map((line) =>
                    line.product.id === product.id
                        ? { ...line, quantity: line.quantity + qty }
                        : line,
                );
            }
            return [...prev, { product, quantity: qty }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setLines((prev) =>
            prev.filter((line) => line.product.id !== productId),
        );
    }, []);

    const updateQuantity = useCallback(
        (productId: string, newQty: number) => {
            if (newQty <= 0) {
                setLines((prev) =>
                    prev.filter((line) => line.product.id !== productId),
                );
                return;
            }
            setLines((prev) =>
                prev.map((line) =>
                    line.product.id === productId
                        ? { ...line, quantity: newQty }
                        : line,
                ),
            );
        },
        [],
    );

    const clearCart = useCallback(() => setLines([]), []);

    const totalUnits = useMemo(
        () => lines.reduce((sum, line) => sum + line.quantity, 0),
        [lines],
    );

    return {
        lines,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalUnits,
    };
}
