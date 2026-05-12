import { useCallback, useState } from 'react';
import type { PadMode } from '../types/pad-mode.type';

interface UsePosNumpadOptions {
    onConfirmDiscount: (amount: number) => void;
    onConfirmCustomItem: (name: string, price: number, qty?: number) => void;
}

export function usePosNumpad({
    onConfirmDiscount,
    onConfirmCustomItem,
}: UsePosNumpadOptions) {
    const [padMode, setPadMode] = useState<PadMode>('idle');
    const [padValue, setPadValue] = useState('');
    const [customName, setCustomName] = useState('');
    const [pendingQty, setPendingQty] = useState<number | null>(null);

    const padPress = useCallback((key: string) => {
        if (key === 'C') {
            setPadValue('');
            return;
        }
        setPadValue((prev) => {
            if (key === '.' && prev.includes('.')) return prev;
            return prev + key;
        });
    }, []);

    const resetPad = useCallback(() => {
        setPadMode('idle');
        setPadValue('');
        setCustomName('');
    }, []);

    const padConfirm = useCallback(() => {
        const val = parseFloat(padValue);
        if (!val && val !== 0) return;

        if (padMode === 'qty') {
            setPendingQty(Math.max(1, Math.floor(val)));
            resetPad();
        } else if (padMode === 'disc') {
            onConfirmDiscount(val);
            resetPad();
        } else if (padMode === 'custom') {
            // Honor pendingQty if the cashier set one before switching to custom mode.
            onConfirmCustomItem(customName, val, pendingQty ?? 1);
            setPendingQty(null);
            resetPad();
        }
    }, [
        padMode,
        padValue,
        customName,
        pendingQty,
        onConfirmDiscount,
        onConfirmCustomItem,
        resetPad,
    ]);

    const toggleMode = useCallback(
        (mode: PadMode) => {
            if (padMode === mode) {
                resetPad();
            } else {
                setPadMode(mode);
                setPadValue('');
                setCustomName('');
            }
        },
        [padMode, resetPad],
    );

    const consumePendingQty = useCallback((): number => {
        const qty = pendingQty ?? 1;
        setPendingQty(null);
        resetPad();
        return qty;
    }, [pendingQty, resetPad]);

    const cancelPendingQty = useCallback(() => {
        setPendingQty(null);
    }, []);

    return {
        padMode,
        padValue,
        customName,
        setCustomName,
        pendingQty,
        padPress,
        padConfirm,
        toggleMode,
        resetPad,
        consumePendingQty,
        cancelPendingQty,
    };
}
