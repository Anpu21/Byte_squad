import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import ConfirmDialog, {
    type ConfirmOptions,
} from '@/components/ui/ConfirmDialog';

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface ConfirmState {
    open: boolean;
    options: ConfirmOptions;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConfirmState | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((options) => {
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setState({ open: true, options });
        });
    }, []);

    const finish = useCallback((result: boolean) => {
        resolveRef.current?.(result);
        resolveRef.current = null;
        // Trigger the close animation first, then drop the node so a follow-up
        // confirm() call can mount fresh.
        setState((s) => (s ? { ...s, open: false } : null));
        setTimeout(() => setState(null), 250);
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state && (
                <ConfirmDialog
                    isOpen={state.open}
                    options={state.options}
                    onConfirm={() => finish(true)}
                    onCancel={() => finish(false)}
                />
            )}
        </ConfirmContext.Provider>
    );
}

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
