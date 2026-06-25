import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { ISupplier, ISupplierPayload, SupplierStatus } from '@/types';
import { useCreateSupplier } from '../../hooks/useCreateSupplier';
import { useUpdateSupplier } from '../../hooks/useUpdateSupplier';

interface ISupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Present = edit mode; absent = create mode. */
    supplier?: ISupplier | null;
}

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors';

/**
 * Outer shell mounts the form only while open so each open starts with
 * fresh local state (same idiom as `ApplyLeaveModal`).
 */
export function SupplierFormModal({
    isOpen,
    onClose,
    supplier = null,
}: ISupplierFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={supplier ? `Edit ${supplier.name}` : 'Add supplier'}
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? (
                <SupplierForm onClose={onClose} supplier={supplier} />
            ) : null}
        </Modal>
    );
}

interface ISupplierFormProps {
    onClose: () => void;
    supplier: ISupplier | null;
}

function SupplierForm({ onClose, supplier }: ISupplierFormProps) {
    const create = useCreateSupplier();
    const update = useUpdateSupplier();
    const isEdit = supplier !== null;

    const [name, setName] = useState(supplier?.name ?? '');
    const [contactName, setContactName] = useState(supplier?.contactName ?? '');
    const [phone, setPhone] = useState(supplier?.phone ?? '');
    const [email, setEmail] = useState(supplier?.email ?? '');
    const [address, setAddress] = useState(supplier?.address ?? '');
    const [creditTermDays, setCreditTermDays] = useState(
        String(supplier?.creditTermDays ?? 30),
    );
    const [openingBalance, setOpeningBalance] = useState(
        String(supplier?.openingBalance ?? 0),
    );
    const [status, setStatus] = useState<SupplierStatus>(
        supplier?.status ?? 'Active',
    );
    const [notes, setNotes] = useState(supplier?.notes ?? '');

    const termsNum = Number(creditTermDays);
    const openingNum = Number(openingBalance);
    const canSubmit =
        name.trim().length >= 2 &&
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
            name: name.trim(),
            contactName: contactName.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            creditTermDays: termsNum,
            openingBalance: openingNum,
            notes: notes.trim() || undefined,
        };
        try {
            if (isEdit) {
                await update.mutateAsync({
                    id: supplier.id,
                    payload: { ...payload, status },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5 sm:col-span-2">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Supplier name
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Lanka Dairies (Pvt) Ltd"
                        required
                        minLength={2}
                        maxLength={160}
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Contact person
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        maxLength={120}
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Phone
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={32}
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Email
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={160}
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Address
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        maxLength={255}
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Credit terms (days)
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="number"
                        min="0"
                        max="365"
                        step="1"
                        value={creditTermDays}
                        onChange={(e) => setCreditTermDays(e.target.value)}
                        required
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Opening balance
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        required
                    />
                </label>
                {isEdit && (
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Status
                        </span>
                        <select
                            className={`${INPUT_CLASS} w-full`}
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as SupplierStatus)
                            }
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </label>
                )}
            </div>
            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Notes (optional)
                </span>
                <textarea
                    className="w-full min-h-[64px] px-3 py-2 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
