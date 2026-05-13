import type {
    IBranchWithMeta,
    IBranchCreatePayload,
    IBranchUpdatePayload,
} from '@/types';
import type { BranchFormState } from './BranchFormFields';

export function initialBranchForm(
    editing: IBranchWithMeta | null,
): BranchFormState {
    return {
        code: editing?.code ?? '',
        name: editing?.name ?? '',
        addressLine1: editing?.addressLine1 ?? '',
        addressLine2: editing?.addressLine2 ?? '',
        city: editing?.city ?? '',
        state: editing?.state ?? '',
        country: editing?.country ?? '',
        postalCode: editing?.postalCode ?? '',
        phone: editing?.phone ?? '',
        email: editing?.email ?? '',
    };
}

function trimOrUndefined(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function buildCreatePayload(
    form: BranchFormState,
): IBranchCreatePayload {
    return {
        code: form.code.trim(),
        name: form.name.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: trimOrUndefined(form.addressLine2),
        city: trimOrUndefined(form.city),
        state: trimOrUndefined(form.state),
        country: trimOrUndefined(form.country),
        postalCode: trimOrUndefined(form.postalCode),
        phone: trimOrUndefined(form.phone),
        email: trimOrUndefined(form.email),
    };
}

export function buildUpdatePayload(
    form: BranchFormState,
): IBranchUpdatePayload {
    return {
        code: form.code.trim(),
        name: form.name.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: trimOrUndefined(form.addressLine2),
        city: trimOrUndefined(form.city),
        state: trimOrUndefined(form.state),
        country: trimOrUndefined(form.country),
        postalCode: trimOrUndefined(form.postalCode),
        phone: trimOrUndefined(form.phone),
        email: trimOrUndefined(form.email),
    };
}
