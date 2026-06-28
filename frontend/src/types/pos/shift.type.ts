export type ShiftStatus = 'Open' | 'Closed';

/** A cashier drawer session (close-time fields are null while Open). */
export interface IPosShift {
    id: string;
    branchId: string;
    cashierId: string;
    status: ShiftStatus;
    openedAt: string;
    closedAt: string | null;
    openingFloat: number;
    countedCash: number | null;
    expectedCash: number | null;
    overShort: number | null;
    totalCash: number | null;
    totalCheque: number | null;
    totalBank: number | null;
    totalCredit: number | null;
    totalElectronic: number | null;
    salesCount: number | null;
    salesTotal: number | null;
    refundsTotal: number | null;
    totalPayIn: number | null;
    totalPayOut: number | null;
    notes: string | null;
    branch?: { id: string; name: string };
}

/** Live drawer summary while a shift is open. */
export interface IShiftLiveSummary {
    cash: number;
    cheque: number;
    bank: number;
    credit: number;
    electronic: number;
    salesCount: number;
    salesTotal: number;
    refundsTotal: number;
    payIn: number;
    payOut: number;
    expectedCash: number;
}

/** Response of `GET /pos/shifts/current`. */
export interface ICurrentShiftResponse {
    shift: IPosShift | null;
    live: IShiftLiveSummary | null;
}

export type CashMovementType = 'PayIn' | 'PayOut';

/** A mid-shift cash drawer adjustment (positive amount; `type` is direction). */
export interface ICashMovement {
    id: string;
    shiftId: string;
    branchId: string;
    cashierId: string;
    type: CashMovementType;
    amount: number;
    reason: string | null;
    createdAt: string;
}

/** Body for `POST /pos/shifts/movements`. */
export interface ICashMovementPayload {
    type: CashMovementType;
    amount: number;
    reason?: string;
}
