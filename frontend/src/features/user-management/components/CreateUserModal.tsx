import { useState } from 'react';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { UserRole } from '@/constants/enums';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { IBranch, IUserCreatePayload } from '@/types';

const INPUT_CLASS =
    'w-full h-9 px-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 transition-colors';

function getErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
            response?: { data?: { message?: string } };
        };
        return axiosErr.response?.data?.message || fallback;
    }
    return fallback;
}

interface CreateUserModalProps {
    branches: IBranch[];
    onClose: () => void;
    onCreated: () => void;
}

export function CreateUserModal({
    branches,
    onClose,
    onCreated,
}: CreateUserModalProps) {
    const [form, setForm] = useState<IUserCreatePayload>({
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.CASHIER,
        branchId: branches[0]?.id || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await userService.create(form);
            toast.success(
                'User created. A welcome email with login credentials has been sent.',
            );
            onCreated();
            onClose();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to create user'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Invite user" maxWidth="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="cum-first-name"
                            className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5"
                        >
                            First name
                        </label>
                        <input
                            id="cum-first-name"
                            type="text"
                            required
                            value={form.firstName}
                            onChange={(e) =>
                                setForm({ ...form, firstName: e.target.value })
                            }
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="cum-last-name"
                            className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5"
                        >
                            Last name
                        </label>
                        <input
                            id="cum-last-name"
                            type="text"
                            required
                            value={form.lastName}
                            onChange={(e) =>
                                setForm({ ...form, lastName: e.target.value })
                            }
                            className={INPUT_CLASS}
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="cum-email"
                        className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5"
                    >
                        Email
                    </label>
                    <input
                        id="cum-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        className={INPUT_CLASS}
                        placeholder="user@company.com"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="cum-role"
                            className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5"
                        >
                            Role
                        </label>
                        <select
                            id="cum-role"
                            value={form.role}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    role: e.target.value as UserRole,
                                })
                            }
                            className={`${INPUT_CLASS} cursor-pointer`}
                        >
                            <option value={UserRole.CASHIER}>Cashier</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor="cum-branch"
                            className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5"
                        >
                            Branch
                        </label>
                        <select
                            id="cum-branch"
                            value={form.branchId}
                            onChange={(e) =>
                                setForm({ ...form, branchId: e.target.value })
                            }
                            className={`${INPUT_CLASS} cursor-pointer`}
                        >
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-surface-2 border border-border rounded-md p-3">
                    <p className="text-xs text-text-2 leading-relaxed">
                        A temporary password will be auto-generated and sent to
                        the user&apos;s email. They must change it on first
                        login.
                    </p>
                </div>

                <div className="flex gap-2 pt-1">
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
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        {isSubmitting ? 'Creating…' : 'Send invite'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
