export enum VoucherType {
    RECEIPT = 'RECEIPT',
    PAYMENT = 'PAYMENT',
    JOURNAL = 'JOURNAL',
    CONTRA = 'CONTRA',
    SALES = 'SALES',
    PURCHASE = 'PURCHASE',
    DEBIT_NOTE = 'DEBIT_NOTE',
    CREDIT_NOTE = 'CREDIT_NOTE',
}

export enum LedgerGroupType {
    ASSET = 'ASSET',
    LIABILITY = 'LIABILITY',
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
    EQUITY = 'EQUITY',
}

export enum BalanceType {
    DEBIT = 'DR',
    CREDIT = 'CR',
}

export enum StockMovementType {
    PURCHASE = 'PURCHASE',
    SALE = 'SALE',
    ADJUSTMENT_IN = 'ADJUSTMENT_IN',
    ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
    OPENING = 'OPENING',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
}

export enum ValuationMethod {
    FIFO = 'FIFO',
    LIFO = 'LIFO',
    AVERAGE = 'AVG',
}

export enum PaymentMode {
    CASH = 'CASH',
    BANK = 'BANK',
    UPI = 'UPI',
    CHEQUE = 'CHEQUE',
    CREDIT = 'CREDIT',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    PARTIAL = 'PARTIAL',
    CANCELLED = 'CANCELLED',
}
