import { useCallback, useMemo, useState } from 'react';
import { useConfirm } from '@/hooks/useConfirm';
import type { IProduct } from '@/types';
import type { CartItem } from '../types/cart-item.type';
import {
    computeEffectiveLineTotal,
    computeLineDiscountValue,
} from '../lib/discount';

function buildLine(
    product: IProduct,
    quantity: number,
    unitPrice: number,
    discountAmount: number | undefined,
): CartItem {
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100;
    const effectiveLineTotal = computeEffectiveLineTotal(
        quantity,
        unitPrice,
        discountAmount,
    );
    return {
        product,
        quantity,
        unitPrice,
        lineTotal,
        lineDiscountAmount: discountAmount,
        effectiveLineTotal,
    };
}

export function usePosCart() {
    const confirm = useConfirm();
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = useCallback((product: IProduct, qty = 1) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? buildLine(
                              item.product,
                              item.quantity + qty,
                              item.unitPrice,
                              item.lineDiscountAmount,
                          )
                        : item,
                );
            }
            return [
                ...prev,
                buildLine(product, qty, Number(product.sellingPrice), undefined),
            ];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart((prev) =>
            prev.filter((item) => item.product.id !== productId),
        );
    }, []);

    const updateQuantity = useCallback(
        (productId: string, newQty: number) => {
            if (newQty <= 0) {
                removeFromCart(productId);
                return;
            }
            setCart((prev) =>
                prev.map((item) =>
                    item.product.id === productId
                        ? buildLine(
                              item.product,
                              newQty,
                              item.unitPrice,
                              item.lineDiscountAmount,
                          )
                        : item,
                ),
            );
        },
        [removeFromCart],
    );

    const setItemDiscount = useCallback(
        (productId: string, amount: number | undefined) => {
            setCart((prev) =>
                prev.map((item) =>
                    item.product.id === productId
                        ? buildLine(
                              item.product,
                              item.quantity,
                              item.unitPrice,
                              amount,
                          )
                        : item,
                ),
            );
        },
        [],
    );

    const clearCart = useCallback(async (): Promise<boolean> => {
        if (cart.length === 0) return false;
        const ok = await confirm({
            title: 'Clear current sale?',
            body: `Remove all ${cart.length} item${cart.length === 1 ? '' : 's'} from the cart. This cannot be undone.`,
            confirmLabel: 'Clear sale',
            tone: 'danger',
        });
        if (!ok) return false;
        setCart([]);
        return true;
    }, [cart.length, confirm]);

    const totals = useMemo(() => {
        const subtotal =
            Math.round(
                cart.reduce((sum, item) => sum + item.lineTotal, 0) * 100,
            ) / 100;
        const lineDiscountsTotal =
            Math.round(
                cart.reduce(
                    (sum, item) =>
                        sum +
                        computeLineDiscountValue(
                            item.quantity,
                            item.unitPrice,
                            item.lineDiscountAmount,
                        ),
                    0,
                ) * 100,
            ) / 100;
        const total = Math.max(
            0,
            Math.round((subtotal - lineDiscountsTotal) * 100) / 100,
        );
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        return {
            subtotal,
            lineDiscountsTotal,
            total,
            totalItems,
        };
    }, [cart]);

    return {
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setItemDiscount,
        clearCart,
        subtotal: totals.subtotal,
        lineDiscountsTotal: totals.lineDiscountsTotal,
        // Kept name for compat with components that bind to it.
        totalDiscount: totals.lineDiscountsTotal,
        total: totals.total,
        totalItems: totals.totalItems,
    };
}
