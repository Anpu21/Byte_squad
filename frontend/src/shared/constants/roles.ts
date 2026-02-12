/**
 * User roles as a const object (frontend convention).
 * Values match the backend Role enum.
 */
export const ROLES = {
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    CASHIER: 'cashier',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
