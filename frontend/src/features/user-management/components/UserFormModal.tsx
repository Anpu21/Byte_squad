import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { IBranch, IUser } from '@/types';
import {
    SRI_LANKA_PHONE_ERROR,
    isValidSriLankaPhone,
} from '@/lib/phone';
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
    onSaved: () => void;
}

function extractApiMessage(err: unknown): string | undefined {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr?.response?.data?.message;
}

export function UserFormModal({
    user,
    branches,
    onClose,
    onSaved,
}: UserFormModalProps) {
    const isEdit = user !== null;
    const [form, setForm] = useState(() => initialUserForm(user, branches));
    const [phoneError, setPhoneError] = useState<string | undefined>(undefined);

    const saveMutation = useMutation({
        mutationFn: () =>
            isEdit && user
                ? userService.update(user.id, buildUpdatePayload(form))
                : userService.create(buildCreatePayload(form)),
        onSuccess: () => {
            toast.success(isEdit ? 'User updated' : 'User invited');
            onSaved();
        },
        onError: (err: unknown) => {
            toast.error(
                extractApiMessage(err) ??
                    (isEdit
                        ? 'Failed to update user'
                        : 'Failed to create user'),
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
            title={isEdit ? 'Edit user' : 'Invite user'}
            maxWidth="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <UserFormFields
                    form={form}
                    branches={branches}
                    isEdit={isEdit}
                    phoneError={phoneError}
                    onChange={(key, value) => {
                        setForm((prev) => ({ ...prev, [key]: value }));
                        if (key === 'phone') setPhoneError(undefined);
                    }}
                />

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
                        disabled={saveMutation.isPending}
                        className="flex-1"
                    >
                        {saveMutation.isPending
                            ? 'Saving…'
                            : isEdit
                              ? 'Save changes'
                              : 'Invite user'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
