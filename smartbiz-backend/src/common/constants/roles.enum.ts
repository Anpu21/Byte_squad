export enum Role {
    ADMIN = 'ADMIN',
    ACCOUNTANT = 'ACCOUNTANT',
    MANAGER = 'MANAGER',
}

export enum Permission {
    // User Management
    CREATE_USER = 'CREATE_USER',
    READ_USER = 'READ_USER',
    UPDATE_USER = 'UPDATE_USER',
    DELETE_USER = 'DELETE_USER',

    // Accounting
    CREATE_VOUCHER = 'CREATE_VOUCHER',
    READ_VOUCHER = 'READ_VOUCHER',
    POST_VOUCHER = 'POST_VOUCHER',
    VOID_VOUCHER = 'VOID_VOUCHER',

    // Ledgers
    CREATE_LEDGER = 'CREATE_LEDGER',
    READ_LEDGER = 'READ_LEDGER',
    UPDATE_LEDGER = 'UPDATE_LEDGER',
    DELETE_LEDGER = 'DELETE_LEDGER',

    // Inventory
    CREATE_ITEM = 'CREATE_ITEM',
    READ_ITEM = 'READ_ITEM',
    UPDATE_ITEM = 'UPDATE_ITEM',
    DELETE_ITEM = 'DELETE_ITEM',
    ADJUST_STOCK = 'ADJUST_STOCK',

    // Reports
    VIEW_REPORTS = 'VIEW_REPORTS',
    EXPORT_REPORTS = 'EXPORT_REPORTS',

    // Backup
    CREATE_BACKUP = 'CREATE_BACKUP',
    RESTORE_BACKUP = 'RESTORE_BACKUP',

    // Company
    MANAGE_COMPANY = 'MANAGE_COMPANY',
    MANAGE_BRANCH = 'MANAGE_BRANCH',
}

// Role-Permission mapping
export const RolePermissions: Record<Role, Permission[]> = {
    [Role.ADMIN]: Object.values(Permission), // Admin has all permissions

    [Role.ACCOUNTANT]: [
        Permission.READ_USER,
        Permission.CREATE_VOUCHER,
        Permission.READ_VOUCHER,
        Permission.POST_VOUCHER,
        Permission.CREATE_LEDGER,
        Permission.READ_LEDGER,
        Permission.UPDATE_LEDGER,
        Permission.CREATE_ITEM,
        Permission.READ_ITEM,
        Permission.UPDATE_ITEM,
        Permission.ADJUST_STOCK,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORTS,
    ],

    [Role.MANAGER]: [
        Permission.READ_USER,
        Permission.READ_VOUCHER,
        Permission.READ_LEDGER,
        Permission.READ_ITEM,
        Permission.VIEW_REPORTS,
    ],
};
