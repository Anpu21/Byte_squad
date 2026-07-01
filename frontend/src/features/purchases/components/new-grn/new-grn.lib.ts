export interface ILineDraft {
    key: number;
    productId: string;
    quantity: string;
    unitCost: string;
    batchNo: string;
    expiryDate: string;
}

let lineKey = 0;

/** Monotonic key for a fresh line row (stable across re-renders). */
export function newLineKey(): number {
    return ++lineKey;
}

export const emptyLine = (): ILineDraft => ({
    key: newLineKey(),
    productId: '',
    quantity: '',
    unitCost: '',
    batchNo: '',
    expiryDate: '',
});

export interface ParsedGrnLine extends ILineDraft {
    qtyNum: number;
    costNum: number;
}

export interface GrnTotals {
    parsedLines: ParsedGrnLine[];
    completeLines: ParsedGrnLine[];
    subTotal: number;
    discountNum: number;
    grandTotal: number;
}

/** Parse the raw line drafts into numbers and roll up subtotal / grand total. */
export function deriveGrnTotals(lines: ILineDraft[], discount: string): GrnTotals {
    const parsedLines = lines.map((l) => ({
        ...l,
        qtyNum: Number(l.quantity),
        costNum: Number(l.unitCost),
    }));
    const completeLines = parsedLines.filter(
        (l) =>
            l.productId &&
            Number.isFinite(l.qtyNum) &&
            l.qtyNum > 0 &&
            Number.isFinite(l.costNum) &&
            l.costNum >= 0,
    );
    const subTotal = completeLines.reduce(
        (sum, l) => sum + l.qtyNum * l.costNum,
        0,
    );
    const discountNum = discount === '' ? 0 : Number(discount);
    const grandTotal =
        subTotal - (Number.isFinite(discountNum) ? discountNum : 0);
    return { parsedLines, completeLines, subTotal, discountNum, grandTotal };
}
