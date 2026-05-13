import { useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import Modal from '@/components/ui/Modal';
import { BranchActionOtpStep } from './BranchActionOtpStep';
import type {
    IBranchWithMeta,
    IBranchCreatePayload,
    IBranchUpdatePayload,
    IBranchActionRequestResponse,
    IBranchActionConfirmResponse,
} from '@/types';

interface BranchFormModalProps {
    editing: IBranchWithMeta | null;
    onClose: () => void;
    onSaved: () => void;
}

interface FormState {
    code: string;
    name: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    email: string;
}

const FIELD_LABEL_CLASS =
    'block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5';
const FIELD_INPUT_CLASS =
    'w-full h-9 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';
const SECTION_TITLE_CLASS =
    'text-[11px] uppercase tracking-widest text-text-2 font-semibold pb-2 border-b border-border';

function initialForm(editing: IBranchWithMeta | null): FormState {
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

function buildCreatePayload(form: FormState): IBranchCreatePayload {
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

function buildUpdatePayload(form: FormState): IBranchUpdatePayload {
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

export function BranchFormModal({
    editing,
    onClose,
    onSaved,
}: BranchFormModalProps) {
    const isEdit = editing !== null;
    const [form, setForm] = useState<FormState>(() => initialForm(editing));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pending, setPending] =
        useState<IBranchActionRequestResponse | null>(null);

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response: IBranchActionRequestResponse =
                isEdit && editing
                    ? await adminService.requestUpdateBranch(
                          editing.id,
                          buildUpdatePayload(form),
                      )
                    : await adminService.requestCreateBranch(
                          buildCreatePayload(form),
                      );
            setPending(response);
            toast.success('Verification code sent to your email');
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: { data?: { message?: string } };
            };
            toast.error(
                axiosErr.response?.data?.message ??
                    (isEdit
                        ? 'Failed to request branch update'
                        : 'Failed to request branch creation'),
            );
        } finally {
            setIsSubmitting(false);
        }
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
                    branchLabel={form.name.trim() || form.code.trim() || 'this branch'}
                    onConfirmed={handleConfirmed}
                    onCancel={() => setPending(null)}
                />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="space-y-3">
                        <h3 className={SECTION_TITLE_CLASS}>Identity</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    Branch Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="BR001"
                                    value={form.code}
                                    onChange={(e) =>
                                        setField(
                                            'code',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className={`${FIELD_INPUT_CLASS} font-mono uppercase`}
                                />
                                <p className="mt-1 text-[11px] text-text-3">
                                    Short unique code — e.g. BR001
                                </p>
                            </div>
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    Branch Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setField('name', e.target.value)
                                    }
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className={SECTION_TITLE_CLASS}>Address</h3>
                        <div>
                            <label className={FIELD_LABEL_CLASS}>
                                Address Line 1
                            </label>
                            <input
                                type="text"
                                required
                                value={form.addressLine1}
                                onChange={(e) =>
                                    setField('addressLine1', e.target.value)
                                }
                                className={FIELD_INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={FIELD_LABEL_CLASS}>
                                Address Line 2
                            </label>
                            <input
                                type="text"
                                value={form.addressLine2}
                                onChange={(e) =>
                                    setField('addressLine2', e.target.value)
                                }
                                className={FIELD_INPUT_CLASS}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={form.city}
                                    onChange={(e) =>
                                        setField('city', e.target.value)
                                    }
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    State / Province
                                </label>
                                <input
                                    type="text"
                                    value={form.state}
                                    onChange={(e) =>
                                        setField('state', e.target.value)
                                    }
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    Country
                                </label>
                                <input
                                    type="text"
                                    value={form.country}
                                    onChange={(e) =>
                                        setField('country', e.target.value)
                                    }
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    Postal Code
                                </label>
                                <input
                                    type="text"
                                    value={form.postalCode}
                                    onChange={(e) =>
                                        setField('postalCode', e.target.value)
                                    }
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className={SECTION_TITLE_CLASS}>Contact</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setField('phone', e.target.value)
                                    }
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={FIELD_LABEL_CLASS}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setField('email', e.target.value)
                                    }
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-2">
                        Sensitive change — we'll email a 6-digit code to your
                        admin address to confirm before applying.
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
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
                                ? 'Sending code…'
                                : isEdit
                                  ? 'Save changes (verify by email)'
                                  : 'Create branch (verify by email)'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
