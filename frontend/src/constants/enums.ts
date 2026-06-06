/**
 * LedgerPro — Enums
 * Shared between frontend components.
 */

export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    CASHIER = 'cashier',
    WORKER = 'worker',
    CUSTOMER = 'customer',
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
    ONLINE = 'online',
}

export enum LedgerEntryType {
    CREDIT = 'credit',
    DEBIT = 'debit',
}

export enum NotificationType {
    LOW_STOCK = 'low_stock',
    SYSTEM = 'system',
    ALERT = 'alert',
    STOCK_TRANSFER = 'stock_transfer',
    CUSTOMER_ORDER = 'customer_order',
}

export enum TransferStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    IN_TRANSIT = 'in_transit',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum ExpenseStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export enum ShipmentStatus {
    PENDING = 'pending',
    READY_TO_SHIP = 'ready_to_ship',
    DISPATCHED = 'dispatched',
    OUT_FOR_DELIVERY = 'out_for_delivery',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    RETURNED = 'returned',
}

export enum ShipmentEventType {
    CREATED = 'created',
    COURIER_ASSIGNED = 'courier_assigned',
    READY_TO_SHIP = 'ready_to_ship',
    DISPATCHED = 'dispatched',
    CHECKPOINT = 'checkpoint',
    OUT_FOR_DELIVERY = 'out_for_delivery',
    DELIVERED = 'delivered',
    RETURNED = 'returned',
    CANCELLED = 'cancelled',
}
