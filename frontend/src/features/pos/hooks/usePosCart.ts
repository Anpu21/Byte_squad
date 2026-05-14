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

interface UsePosCartOptions {
    stockByProductId?: Record<string, number>;
}

export function usePosCart(options: UsePosCartOptions = {}) {
    const confirm = useConfirm();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [blockedReason, setBlockedReason] = useState<string | null>(null);

    const stockMap = options.stockByProductId;

    const clamp = useCallback(
        (productId: string, desired: number, productName?: string): number => {
            if (!stockMap) return desired;
            const stock = stockMap[productId];
            if (stock === undefined) return desired;
            if (desired > stock) {
                setBlockedReason(
                    productName
                        ? `Only ${stock} in stock for ${productName}`
                        : `Only ${stock} in stock`,
                );
                return Math.max(0, stock);
            }
            return desired;
        },
        [stockMap],
    );

    const addToCart = useCallback(
        (product: IProduct, qty = 1) => {
            setBlockedReason(null);
            setCart((prev) => {
                const existing = prev.find(
                    (item) => item.product.id === product.id,
                );
                if (existing) {
                    const next = clamp(
                        product.id,
                        existing.quantity + qty,
                        product.name,
                    );
                    if (next === existing.quantity) return prev;
                    return prev.map((item) =>
                        item.product.id === product.id
                            ? buildLine(
                                  item.product,
                                  next,
                                  item.unitPrice,
                                  item.lineDiscountAmount,
                              )
                            : item,
                    );
                }
                const next = clamp(product.id, qty, product.name);
                if (next <= 0) return prev;
                return [
                    ...prev,
                    buildLine(
                        product,
                        next,
                        Number(product.sellingPrice),
                        undefined,
                    ),
                ];
            });
        },
        [clamp],
    );

    const removeFromCart = useCallback((productId: string) => {
        setBlockedReason(null);
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
            setBlockedReason(null);
            setCart((prev) => {
                const existing = prev.find(
                    (item) => item.product.id === productId,
                );
                if (!existing) return prev;
                const capped = clamp(
                    productId,
                    newQty,
                    existing.product.name,
                );
                if (capped === existing.quantity) return prev;
                return prev.map((item) =>
                    item.product.id === productId
                        ? buildLine(
                              item.product,
                              capped,
                              item.unitPrice,
                              item.lineDiscountAmount,
                          )
                        : item,
                );
            });
        },
        [removeFromCart, clamp],
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
        setBlockedReason(null);
        return true;
    }, [cart.length, confirm]);

    const dismissBlockedReason = useCallback(
        () => setBlockedReason(null),
        [],
    );

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
        blockedReason,
        dismissBlockedReason,
        subtotal: totals.subtotal,
        lineDiscountsTotal: totals.lineDiscountsTotal,
        // Kept name for compat with components that bind to it.
        totalDiscount: totals.lineDiscountsTotal,
        total: totals.total,
        totalItems: totals.totalItems,
    };
}
