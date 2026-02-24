/**
 * LedgerPro — Shared Enums
 * Used by both frontend and backend.
 */

export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    ACCOUNTANT = 'accountant',
    CASHIER = 'cashier',
}

export enum TransactionType {
    SALE = 'sale',
    RETURN = 'return',
    VOID = 'void',
}

export enum InventoryStatus {
    IN_STOCK = 'in_stock',
    LOW_STOCK = 'low_stock',
    OUT_OF_STOCK = 'out_of_stock',
}

export enum OtpPurpose {
    EMAIL_VERIFICATION = 'email_verification',
    PASSWORD_RESET = 'password_reset',
}

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
    NONE = 'none',
}

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    MOBILE = 'mobile',
}

export enum LedgerEntryType {
    CREDIT = 'credit',
    DEBIT = 'debit',
}

export enum NotificationType {
    LOW_STOCK = 'low_stock',
    SYSTEM = 'system',
    ALERT = 'alert',
}
