import { useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import Modal from '@/components/ui/Modal';
import type {
    IBranchWithMeta,
    IBranchCreatePayload,
    IBranchUpdatePayload,
} from '@/types';

interface BranchFormModalProps {
    editing: IBranchWithMeta | null;
    onClose: () => void;
    onSaved: () => void;
}

const FIELD_LABEL_CLASS =
    'block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5';
const FIELD_INPUT_CLASS =
    'w-full h-9 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

export function BranchFormModal({
    editing,
    onClose,
    onSaved,
}: BranchFormModalProps) {
    const isEdit = editing !== null;
    const [form, setForm] = useState<IBranchCreatePayload>({
        name: editing?.name ?? '',
        address: editing?.address ?? '',
        phone: editing?.phone ?? '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEdit && editing) {
                const payload: IBranchUpdatePayload = { ...form };
                await adminService.updateBranch(editing.id, payload);
                toast.success('Branch updated');
            } else {
                await adminService.createBranch(form);
                toast.success('Branch created');
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(
                axiosErr.response?.data?.message ||
                    (isEdit ? 'Failed to update branch' : 'Failed to create branch'),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={isEdit ? 'Edit Branch' : 'Create Branch'}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={FIELD_LABEL_CLASS}>Name</label>
                    <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        className={FIELD_INPUT_CLASS}
                    />
                </div>
                <div>
                    <label className={FIELD_LABEL_CLASS}>Address</label>
                    <input
                        type="text"
                        required
                        value={form.address}
                        onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                        }
                        className={FIELD_INPUT_CLASS}
                    />
                </div>
                <div>
                    <label className={FIELD_LABEL_CLASS}>Phone</label>
                    <input
                        type="text"
                        value={form.phone}
                        onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                        }
                        className={FIELD_INPUT_CLASS}
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-9 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-9 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                    >
                        {isSubmitting
                            ? 'Saving...'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Branch'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
