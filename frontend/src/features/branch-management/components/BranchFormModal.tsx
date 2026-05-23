import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
    SRI_LANKA_PHONE_ERROR,
    isValidSriLankaPhone,
} from '@/lib/phone';
import { BranchFormFields } from './BranchFormFields';
import {
    buildCreatePayload,
    buildUpdatePayload,
    initialBranchForm,
} from './branch-form.helpers';
import type { IBranchWithMeta } from '@/types';

interface BranchFormModalProps {
    editing: IBranchWithMeta | null;
    onClose: () => void;
    onSaved: () => void;
}

function extractApiMessage(err: unknown): string | undefined {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr?.response?.data?.message;
}

export function BranchFormModal({
    editing,
    onClose,
    onSaved,
}: BranchFormModalProps) {
    const isEdit = editing !== null;
    const [form, setForm] = useState(() => initialBranchForm(editing));
    const [phoneError, setPhoneError] = useState<string | undefined>(undefined);

    const saveMutation = useMutation({
        mutationFn: () =>
            isEdit && editing
                ? adminService.updateBranch(
                      editing.id,
                      buildUpdatePayload(form),
                  )
                : adminService.createBranch(buildCreatePayload(form)),
        onSuccess: () => {
            toast.success(isEdit ? 'Branch updated' : 'Branch created');
            onSaved();
            onClose();
        },
        onError: (err: unknown) => {
            toast.error(
                extractApiMessage(err) ??
                    (isEdit
                        ? 'Failed to update branch'
                        : 'Failed to create branch'),
            );
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.phone.trim() && !isValidSriLankaPhone(form.phone)) {
            setPhoneError(SRI_LANKA_PHONE_ERROR);
            return;
        }
        setPhoneError(undefined);
        saveMutation.mutate();
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={isEdit ? 'Edit Branch' : 'Create Branch'}
            maxWidth="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <BranchFormFields
                    form={form}
                    phoneError={phoneError}
                    onChange={(key, value) => {
                        setForm((prev) => ({ ...prev, [key]: value }));
                        if (key === 'phone') setPhoneError(undefined);
                    }}
                />
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="flex-1"
                    >
                        {saveMutation.isPending
                            ? 'Saving…'
                            : isEdit
                              ? 'Save changes'
                              : 'Create branch'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
