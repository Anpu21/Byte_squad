import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { BranchActionOtpStep } from './BranchActionOtpStep';
import { BranchFormFields } from './BranchFormFields';
import {
    buildCreatePayload,
    buildUpdatePayload,
    initialBranchForm,
} from './branch-form.helpers';
import type {
    IBranchWithMeta,
    IBranchActionRequestResponse,
    IBranchActionConfirmResponse,
} from '@/types';

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
    const [pending, setPending] =
        useState<IBranchActionRequestResponse | null>(null);

    const requestMutation = useMutation({
        mutationFn: () =>
            isEdit && editing
                ? adminService.requestUpdateBranch(
                      editing.id,
                      buildUpdatePayload(form),
                  )
                : adminService.requestCreateBranch(buildCreatePayload(form)),
        onSuccess: (response) => {
            setPending(response);
            toast.success('Verification code sent to your email');
        },
        onError: (err: unknown) => {
            toast.error(
                extractApiMessage(err) ??
                    (isEdit
                        ? 'Failed to request branch update'
                        : 'Failed to request branch creation'),
            );
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestMutation.mutate();
    };

    const handleConfirmed = (result: IBranchActionConfirmResponse) => {
        toast.success(
            result.action === 'create' ? 'Branch created' : 'Branch updated',
        );
        onSaved();
        onClose();
    };

    const title = pending
        ? isEdit
            ? 'Confirm branch changes'
            : 'Confirm new branch'
        : isEdit
          ? 'Edit Branch'
          : 'Create Branch';

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={title}
            maxWidth="2xl"
            closeOnBackdrop={!pending}
        >
            {pending ? (
                <BranchActionOtpStep
                    actionId={pending.actionId}
                    expiresAt={pending.expiresAt}
                    action={pending.action}
                    branchLabel={
                        form.name.trim() || form.code.trim() || 'this branch'
                    }
                    onConfirmed={handleConfirmed}
                    onCancel={() => setPending(null)}
                />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <BranchFormFields
                        form={form}
                        onChange={(key, value) =>
                            setForm((prev) => ({ ...prev, [key]: value }))
                        }
                    />
                    <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-2">
                        Sensitive change — we'll email a 6-digit code to your
                        admin address to confirm before applying.
                    </div>
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
                            disabled={requestMutation.isPending}
                            className="flex-1"
                        >
                            {requestMutation.isPending
                                ? 'Sending code…'
                                : isEdit
                                  ? 'Save changes (verify by email)'
                                  : 'Create branch (verify by email)'}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
