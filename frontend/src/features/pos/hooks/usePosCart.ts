import { useCallback, useState } from 'react';
import { useConfirm } from '@/hooks/useConfirm';
import type { IProduct } from '@/types';
import type { CartItem } from '../types/cart-item.type';
import type { DiscountType } from '../types/pad-mode.type';
import { computeDiscountValue, computeTotal } from '../lib/discount';

export function usePosCart() {
    const confirm = useConfirm();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountType, setDiscountType] = useState<DiscountType>('fixed');

    const addToCart = useCallback((product: IProduct, qty = 1) => {
        setCart((prev) => {
            const existing = prev.find(
                (item) => item.product.id === product.id && !item.isCustom,
            );
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id && !item.isCustom
                        ? {
                              ...item,
                              quantity: item.quantity + qty,
                              lineTotal:
                                  (item.quantity + qty) * item.unitPrice,
                          }
                        : item,
                );
            }
            return [
                ...prev,
                {
                    product,
                    quantity: qty,
                    unitPrice: Number(product.sellingPrice),
                    lineTotal: qty * Number(product.sellingPrice),
                },
            ];
        });
    }, []);

    const addCustomItem = useCallback(
        (name: string, price: number, qty = 1) => {
            if (!name.trim() || price <= 0) return;
            const customProduct: IProduct = {
                id:
                    typeof crypto !== 'undefined' && 'randomUUID' in crypto
                        ? `custom-${crypto.randomUUID()}`
                        : `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: name.trim(),
                barcode: '',
                description: 'Custom item',
                category: 'Custom',
                costPrice: 0,
                sellingPrice: price,
                imageUrl: null,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            };
            setCart((prev) => [
                ...prev,
                {
                    product: customProduct,
                    quantity: qty,
                    unitPrice: price,
                    lineTotal: qty * price,
                    isCustom: true,
                },
            ]);
        },
        [],
    );

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
                        ? {
                              ...item,
                              quantity: newQty,
                              lineTotal: newQty * item.unitPrice,
                          }
                        : item,
                ),
            );
        },
        [removeFromCart],
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
        setDiscountAmount(0);
        return true;
    }, [cart.length, confirm]);

    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountValue = computeDiscountValue(
        subtotal,
        discountAmount,
        discountType,
    );
    const total = computeTotal(subtotal, discountValue);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
        cart,
        setCart,
        addToCart,
        addCustomItem,
        removeFromCart,
        updateQuantity,
        clearCart,
        discountAmount,
        setDiscountAmount,
        discountType,
        setDiscountType,
        subtotal,
        discountValue,
        total,
        totalItems,
    };
}
