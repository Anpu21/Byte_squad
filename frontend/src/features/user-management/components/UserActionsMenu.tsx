import { MoreHorizontal } from 'lucide-react';
import type { IUser } from '@/types';

interface UserActionsMenuProps {
    user: IUser;
    isOpen: boolean;
    onToggle: () => void;
    onResendCredentials: (id: string) => void;
    onResetPassword: (user: IUser) => void;
    onDelete: (user: IUser) => void;
}

export function UserActionsMenu({
    user,
    isOpen,
    onToggle,
    onResendCredentials,
    onResetPassword,
    onDelete,
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
                <div className="absolute right-3 top-10 z-10 w-48 bg-surface border border-border rounded-md shadow-xl py-1">
                    {!user.isVerified && (
                        <button
                            type="button"
                            onClick={() => {
                                onResendCredentials(user.id);
                                close();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-text-1 hover:bg-surface-2 transition-colors"
                        >
                            Resend credentials
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            close();
                            onResetPassword(user);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text-1 hover:bg-surface-2 transition-colors"
                    >
                        Reset password
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            close();
                            onDelete(user);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
                    >
                        Delete user
                    </button>
                </div>
            )}
        </div>
    );
}
