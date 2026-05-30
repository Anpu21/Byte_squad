/**
 * Editable form row shape for the sellable-units editor card. Mirrors the
 * server-side `SellableUnitDto` but keeps `conversionToBase` as a string
 * during editing (the input is a text field that the user can leave in a
 * partial state like "0.0" before completing). `rowId` is a UI-only stable
 * key for React lists; it never reaches the API payload.
 */
export interface ISellableUnitRow {
    rowId: string;
    name: string;
    isBase: boolean;
    conversionToBase: string;
    displayOrder: number;
}
