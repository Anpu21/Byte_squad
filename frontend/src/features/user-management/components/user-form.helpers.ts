import { UserRole } from '@/constants/enums';
import type {
    IBranch,
    IUser,
    IUserCreatePayload,
    IUserUpdatePayload,
} from '@/types';
import { normalizeSriLankaPhone } from '@/lib/phone';

export interface UserFormState {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    branchId: string;
    address: string;
}

export const STAFF_ROLES: UserRole[] = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
];

export function initialUserForm(
    editing: IUser | null,
    branches: IBranch[],
): UserFormState {
    if (editing) {
        return {
            firstName: editing.firstName,
            lastName: editing.lastName,
            email: editing.email,
            phone: editing.phone ?? '',
            role: editing.role,
            branchId: editing.branchId ?? '',
            address: editing.address ?? '',
        };
    }
    return {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: UserRole.CASHIER,
        branchId: branches[0]?.id ?? '',
        address: '',
    };
}

function emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
}

function phoneToPayload(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    return normalizeSriLankaPhone(trimmed);
}

export function buildCreatePayload(form: UserFormState): IUserCreatePayload {
    return {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        branchId: form.branchId,
        phone: phoneToPayload(form.phone),
        address: emptyToNull(form.address),
    };
}

export function buildUpdatePayload(form: UserFormState): IUserUpdatePayload {
    return {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        branchId: form.branchId === '' ? null : form.branchId,
        phone: phoneToPayload(form.phone),
        address: emptyToNull(form.address),
    };
}
