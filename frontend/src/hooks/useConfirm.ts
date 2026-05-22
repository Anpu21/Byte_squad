import { createContext, useContext } from 'react';
import type { ConfirmOptions } from '@/components/ui/ConfirmDialog';

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Imperatively prompt the user for confirmation. Returns a Promise that
 * resolves to `true` if confirmed and `false` if cancelled (or dismissed).
 *
 * @example
 * const confirm = useConfirm();
 * const ok = await confirm({
 *   title: 'Delete user?',
 *   body: `This will remove ${user.name} permanently.`,
 *   confirmLabel: 'Delete',
 *   tone: 'danger',
 * });
 * if (ok) deleteUser(user.id);
 */
export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within <ConfirmProvider>');
    }
    return ctx;
}
