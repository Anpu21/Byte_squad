export interface PriceDerived {
    marginPct: number | null;
    markupPct: number | null;
    profitAbs: number | null;
}

export function computePriceDerived(
    costPriceStr: string,
    sellingPriceStr: string,
): PriceDerived {
    const cost = parseFloat(costPriceStr);
    const sell = parseFloat(sellingPriceStr);
    const valid = !isNaN(cost) && !isNaN(sell) && cost > 0 && sell > 0;
    if (!valid) {
        return { marginPct: null, markupPct: null, profitAbs: null };
    }
    return {
        marginPct: ((sell - cost) / sell) * 100,
        markupPct: ((sell - cost) / cost) * 100,
        profitAbs: sell - cost,
    };
}
