import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type {
    IBranch,
    IUser,
    IUserActionRequestResponse,
} from '@/types';
import { UserFormFields } from './UserFormFields';
import {
    buildCreatePayload,
    buildUpdatePayload,
    initialUserForm,
} from './user-form.helpers';

interface UserFormModalProps {
    user: IUser | null;
    branches: IBranch[];
    onClose: () => void;
    onStaged: (
        response: IUserActionRequestResponse,
        targetLabel: string,
    ) => void;
}

function extractApiMessage(err: unknown): string | undefined {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr?.response?.data?.message;
}

export function UserFormModal({
    user,
    branches,
    onClose,
    onStaged,
}: UserFormModalProps) {
    const isEdit = user !== null;
    const [form, setForm] = useState(() => initialUserForm(user, branches));

    const requestMutation = useMutation({
        mutationFn: () =>
            isEdit && user
                ? userService.requestUpdate(user.id, buildUpdatePayload(form))
                : userService.requestCreate(buildCreatePayload(form)),
        onSuccess: (response) => {
            const label = `${form.firstName.trim()} ${form.lastName.trim()}`.trim() ||
                form.email.trim() ||
                'this user';
            onStaged(response, label);
            toast.success('Verification code sent to your email');
        },
        onError: (err: unknown) => {
            toast.error(
                extractApiMessage(err) ??
                    (isEdit
                        ? 'Failed to request user update'
                        : 'Failed to request user creation'),
            );
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestMutation.mutate();
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={isEdit ? 'Edit user' : 'Invite user'}
            maxWidth="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <UserFormFields
                    form={form}
                    branches={branches}
                    isEdit={isEdit}
                    onChange={(key, value) =>
                        setForm((prev) => ({ ...prev, [key]: value }))
                    }
                />

                <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-2">
                    Sensitive change — we'll email a 6-digit code to your admin
                    address to confirm before applying.
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
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
                              : 'Invite user (verify by email)'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
