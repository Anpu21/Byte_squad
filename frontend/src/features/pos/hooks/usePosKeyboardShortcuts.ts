import { useEffect } from 'react';

interface UsePosKeyboardShortcutsOptions {
    onFocusSearch: () => void;
    onOpenCheckout: () => void;
    onEscape: () => void;
    canCheckout: boolean;
}

export function usePosKeyboardShortcuts({
    onFocusSearch,
    onOpenCheckout,
    onEscape,
    canCheckout,
}: UsePosKeyboardShortcutsOptions) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                onFocusSearch();
            } else if (e.key === 'F12' && canCheckout) {
                e.preventDefault();
                onOpenCheckout();
            } else if (e.key === 'Escape') {
                onEscape();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onFocusSearch, onOpenCheckout, onEscape, canCheckout]);
}
