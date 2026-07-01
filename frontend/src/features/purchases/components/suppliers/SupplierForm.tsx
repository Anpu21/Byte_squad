import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { ISupplier, ISupplierPayload } from '@/types';
import { useCreateSupplier } from '../../hooks/useCreateSupplier';
import { useUpdateSupplier } from '../../hooks/useUpdateSupplier';
import {
    SupplierFormFields,
    type SetSupplierField,
    type SupplierFormValues,
} from './SupplierFormFields';

interface ISupplierFormProps {
    onClose: () => void;
    supplier: ISupplier | null;
}

export function SupplierForm({ onClose, supplier }: ISupplierFormProps) {
    const create = useCreateSupplier();
    const update = useUpdateSupplier();
    const isEdit = supplier !== null;

    const [form, setForm] = useState<SupplierFormValues>({
        name: supplier?.name ?? '',
        contactName: supplier?.contactName ?? '',
        phone: supplier?.phone ?? '',
        email: supplier?.email ?? '',
        address: supplier?.address ?? '',
        creditTermDays: String(supplier?.creditTermDays ?? 30),
        openingBalance: String(supplier?.openingBalance ?? 0),
        status: supplier?.status ?? 'Active',
        notes: supplier?.notes ?? '',
    });
    const set: SetSupplierField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const termsNum = Number(form.creditTermDays);
    const openingNum = Number(form.openingBalance);
    const canSubmit =
        form.name.trim().length >= 2 &&
        Number.isInteger(termsNum) &&
        termsNum >= 0 &&
        termsNum <= 365 &&
        Number.isFinite(openingNum) &&
        openingNum >= 0;

    const isPending = create.isPending || update.isPending;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || isPending) return;
        const payload: ISupplierPayload = {
            name: form.name.trim(),
            contactName: form.contactName.trim() || undefined,
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
            address: form.address.trim() || undefined,
            creditTermDays: termsNum,
            openingBalance: openingNum,
            notes: form.notes.trim() || undefined,
        };
        try {
            if (isEdit) {
                await update.mutateAsync({
                    id: supplier.id,
                    payload: { ...payload, status: form.status },
                });
                toast.success('Supplier updated');
            } else {
                await create.mutateAsync(payload);
                toast.success('Supplier added');
            }
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not save supplier');
            } else {
                toast.error('Could not save supplier');
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <SupplierFormFields form={form} set={set} isEdit={isEdit} />
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Notes (optional)
                </span>
                <textarea
                    className={`${FIELD_SHELL} ${FIELD_BORDER} w-full min-h-[64px] px-3 py-2`}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    maxLength={1000}
                />
            </label>
            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isPending || !canSubmit}
                >
                    {isPending
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Add supplier'}
                </Button>
            </div>
        </form>
    );
}
