import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import { computeLine } from '@/features/pos/lib/line-total';

/**
 * Holds the cashier cart for one in-flight sale. Pure client state — no
 * server round-trip until checkout. Derived totals (`itemsSubtotal`,
 * `totalDiscount`, `totalTax`, `cartTotal`) are memoised off `cart` and
 * stay in sync with each row's `computeLine` output.
 *
 * Shanel rule: adding a duplicate productId+unitId stacks the quantity on
 * the existing row instead of inserting a second row. Lets the cashier
 * scan a barcode twice and see qty go up.
 *
 * An optional `schemeResolver` applies automatic discount schemes at
 * add-time: a fresh line with no discount gets the scheme percentage,
 * and stacking quantity re-evaluates the slab. A manual discount the
 * cashier typed (any value the resolver would not have produced) is
 * never overwritten.
 */

type AddItemSeed = Omit<
    ICartItem,
    | 'rowId'
    | 'lineSubtotal'
    | 'lineDiscountAmount'
    | 'lineTaxAmount'
    | 'lineTotal'
    | 'baseUnitQty'
>;

export type SchemeDiscountResolver = (input: {
    productId: string;
    category: string;
    quantity: number;
}) => number;

export interface UsePosCartReturn {
    cart: ICartItem[];
    addItem: (item: AddItemSeed) => void;
    updateItem: (rowId: string, patch: Partial<ICartItem>) => void;
    removeItem: (rowId: string) => void;
    clear: () => void;
    /** Replace the whole cart (hold/resume) — lines are recomputed. */
    restore: (items: ICartItem[]) => void;
    itemsSubtotal: number;
    totalDiscount: number;
    totalTax: number;
    cartTotal: number;
}

function newRowId(): string {
    return crypto.randomUUID();
}

function recompute(item: ICartItem): ICartItem {
    return { ...item, ...computeLine(item) };
}

const CART_STORAGE_KEY = 'ledgerpro_pos_cart';

export function usePosCart(
    schemeResolver?: SchemeDiscountResolver,
): UsePosCartReturn {
    const [cart, setCart] = useState<ICartItem[]>(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    const addItem = useCallback<UsePosCartReturn['addItem']>(
        (seed) => {
            setCart((prev) => {
                const dup = prev.find(
                    (p) =>
                        p.productId === seed.productId &&
                        p.unitId === seed.unitId,
                );
                if (dup) {
                    const quantity = dup.quantity + seed.quantity;
                    let discountPercentage = dup.discountPercentage;
                    if (schemeResolver && dup.discountAllowed) {
                        // Re-evaluate the slab only when the row's discount
                        // is untouched (0) or was scheme-set for the old
                        // quantity — a manual override survives stacking.
                        const schemeSet =
                            dup.discountPercentage === 0 ||
                            dup.discountPercentage ===
                                schemeResolver({
                                    productId: dup.productId,
                                    category: dup.productType,
                                    quantity: dup.quantity,
                                });
                        if (schemeSet) {
                            const next = schemeResolver({
                                productId: dup.productId,
                                category: dup.productType,
                                quantity,
                            });
                            if (next > 0) discountPercentage = next;
                        }
                    }
                    return prev.map((p) =>
                        p.rowId === dup.rowId
                            ? recompute({ ...p, quantity, discountPercentage })
                            : p,
                    );
                }
                const seeded = { ...seed };
                if (
                    schemeResolver &&
                    seeded.discountAllowed &&
                    seeded.discountPercentage === 0
                ) {
                    const pct = schemeResolver({
                        productId: seeded.productId,
                        category: seeded.productType,
                        quantity: seeded.quantity,
                    });
                    if (pct > 0) seeded.discountPercentage = pct;
                }
                const fresh: ICartItem = {
                    ...seeded,
                    rowId: newRowId(),
                    lineSubtotal: 0,
                    lineDiscountAmount: 0,
                    lineTaxAmount: 0,
                    lineTotal: 0,
                    baseUnitQty: 0,
                };
                return [...prev, recompute(fresh)];
            });
        },
        [schemeResolver],
    );

    const updateItem = useCallback<UsePosCartReturn['updateItem']>(
        (rowId, patch) => {
            setCart((prev) =>
                prev.map((p) =>
                    p.rowId === rowId ? recompute({ ...p, ...patch }) : p,
                ),
            );
        },
        [],
    );

    const removeItem = useCallback((rowId: string) => {
        setCart((prev) => prev.filter((p) => p.rowId !== rowId));
    }, []);

    const clear = useCallback(() => setCart([]), []);

    const restore = useCallback((items: ICartItem[]) => {
        setCart(items.map((item) => recompute({ ...item })));
    }, []);

    const totals = useMemo(() => {
        const itemsSubtotal = cart.reduce((s, c) => s + c.lineSubtotal, 0);
        const totalDiscount = cart.reduce((s, c) => s + c.lineDiscountAmount, 0);
        const totalTax = cart.reduce((s, c) => s + c.lineTaxAmount, 0);
        const cartTotal = cart.reduce((s, c) => s + c.lineTotal, 0);
        return { itemsSubtotal, totalDiscount, totalTax, cartTotal };
    }, [cart]);

    return { cart, addItem, updateItem, removeItem, clear, restore, ...totals };
}
