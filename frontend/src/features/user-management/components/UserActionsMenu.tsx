import { MoreHorizontal, Pencil, KeyRound, Trash2 } from 'lucide-react';
import type { IUser } from '@/types';

interface UserActionsMenuProps {
    user: IUser;
    isOpen: boolean;
    onToggle: () => void;
    onEdit: (user: IUser) => void;
    onRequestResetPassword: (user: IUser) => void;
    onRequestDelete: (user: IUser) => void;
}

export function UserActionsMenu({
    user,
    isOpen,
    onToggle,
    onEdit,
    onRequestResetPassword,
    onRequestDelete,
}: UserActionsMenuProps) {
    const close = () => onToggle();
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className="p-1.5 text-text-3 hover:text-text-1 rounded-md hover:bg-surface-2 transition-colors"
                aria-label="Actions"
            >
                <MoreHorizontal size={16} />
            </button>
            {isOpen && (
                <div className="absolute right-3 top-10 z-dropdown w-52 bg-surface border border-border rounded-md shadow-xl py-1">
                    <button
                        type="button"
                        onClick={() => {
                            close();
                            onEdit(user);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text-1 hover:bg-surface-2 transition-colors flex items-center gap-2"
                    >
                        <Pencil size={14} className="text-text-3" />
                        Edit user
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            close();
                            onRequestResetPassword(user);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text-1 hover:bg-surface-2 transition-colors flex items-center gap-2"
                    >
                        <KeyRound size={14} className="text-text-3" />
                        {user.isVerified
                            ? 'Reset password'
                            : 'Resend credentials'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            close();
                            onRequestDelete(user);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-soft transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={14} />
                        Delete user
                    </button>
                </div>
            )}
        </div>
    );
}
