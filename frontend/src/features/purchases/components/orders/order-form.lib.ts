export interface IOrderLineDraft {
    key: number;
    productId: string;
    quantity: string;
    unitCost: string;
}

let orderLineKey = 0;

/** Monotonic key for a fresh order line (stable across re-renders). */
export function newOrderLineKey(): number {
    return ++orderLineKey;
}

export const emptyLine = (): IOrderLineDraft => ({
    key: newOrderLineKey(),
    productId: '',
    quantity: '',
    unitCost: '',
});

export interface ParsedOrderLine extends IOrderLineDraft {
    qtyNum: number;
    costNum: number;
}

export interface OrderTotals {
    parsed: ParsedOrderLine[];
    complete: ParsedOrderLine[];
    totalValue: number;
}

/** Parse the order lines into numbers and roll up the order value. */
export function deriveOrderTotals(lines: IOrderLineDraft[]): OrderTotals {
    const parsed = lines.map((l) => ({
        ...l,
        qtyNum: Number(l.quantity),
        costNum: Number(l.unitCost),
    }));
    const complete = parsed.filter(
        (l) =>
            l.productId &&
            Number.isFinite(l.qtyNum) &&
            l.qtyNum > 0 &&
            Number.isFinite(l.costNum) &&
            l.costNum >= 0,
    );
    const totalValue = complete.reduce(
        (sum, l) => sum + l.qtyNum * l.costNum,
        0,
    );
    return { parsed, complete, totalValue };
}
