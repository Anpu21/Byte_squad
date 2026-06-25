/**
 * Document families numbered by `purchase_doc_counters` — one sequence per
 * (docType, year): GRN (goods received note), PO (purchase order),
 * SPAY (supplier payment), PRET (purchase return / debit note).
 */
export const PURCHASE_DOC_TYPES = ['GRN', 'PO', 'SPAY', 'PRET'] as const;

export type PurchaseDocType = (typeof PURCHASE_DOC_TYPES)[number];
