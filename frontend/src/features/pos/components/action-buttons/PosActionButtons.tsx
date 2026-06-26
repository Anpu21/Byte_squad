import { useEffect } from 'react';
import { LuSearch as Search, LuTrash2 as Trash2, LuPrinter as Printer, LuHistory as History, LuCreditCard as CreditCard } from 'react-icons/lu';
import { type IconType as LucideIcon } from 'react-icons';
import { useConfirm } from '@/hooks/useConfirm';

interface IPosActionButtonsProps {
    onFocusSearch: () => void;
    onClearCart: () => void;
    onPrintLastReceipt: () => void;
    onShowRecent: () => void;
    onCharge: () => void;
    isCartEmpty: boolean;
    hasLastReceipt: boolean;
    disableCharge: boolean;
}

type TActionKey =
    | 'focusSearch' | 'clearCart'
    | 'printLastReceipt' | 'showRecent' | 'charge';

interface IActionDescriptor {
    key: TActionKey;
    label: string;
    shortcut: 'F2' | 'F5' | 'F9' | 'F10' | 'F12';
    Icon: LucideIcon;
}

const ACTIONS: readonly IActionDescriptor[] = [
    { key: 'focusSearch', label: 'Search', shortcut: 'F2', Icon: Search },
    { key: 'clearCart', label: 'Clear cart', shortcut: 'F5', Icon: Trash2 },
    { key: 'printLastReceipt', label: 'Print last', shortcut: 'F9', Icon: Printer },
    { key: 'showRecent', label: 'Recent sales', shortcut: 'F10', Icon: History },
    { key: 'charge', label: 'Charge', shortcut: 'F12', Icon: CreditCard },
];

const BASE_BUTTON =
    'flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-md transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-[3px] focus:ring-primary/30';
const ENABLED_PRIMARY =
    `${BASE_BUTTON} border border-primary bg-primary text-text-inv shadow-sm-token hover:bg-primary-hover`;
const ENABLED_NEUTRAL =
    `${BASE_BUTTON} border border-border-strong bg-surface text-text-1 hover:border-primary hover:bg-surface-2`;
const DISABLED =
    `${BASE_BUTTON} border border-border-strong bg-surface-2 text-text-3 opacity-60 cursor-not-allowed`;

/**
 * Horizontal F-key bar at the bottom of the cashier workspace. Each pill
 * shows label + the F-key as subscript. The document-level handler fires
 * the same callbacks as the click path; modifier-key combos and editable
 * focus short-circuit so we don't hijack browser shortcuts or numeric
 * entry. F5 (clear) is gated behind `useConfirm`; F5/F12 are disabled
 * when the cart is empty; F9 is disabled until a previous receipt exists.
 */
export function PosActionButtons({
    onFocusSearch,
    onClearCart,
    onPrintLastReceipt,
    onShowRecent,
    onCharge,
    isCartEmpty,
    hasLastReceipt,
    disableCharge,
}: IPosActionButtonsProps) {
    const confirm = useConfirm();

    const isDisabled = (key: TActionKey): boolean => {
        if (key === 'clearCart') return isCartEmpty;
        if (key === 'charge') return disableCharge;
        if (key === 'printLastReceipt') return !hasLastReceipt;
        return false;
    };

    const fire = (key: TActionKey): void => {
        if (isDisabled(key)) return;
        if (key === 'focusSearch') return onFocusSearch();
        if (key === 'printLastReceipt') return onPrintLastReceipt();
        if (key === 'showRecent') return onShowRecent();
        if (key === 'charge') return onCharge();
        // clearCart — gate behind useConfirm; do not call onClearCart on cancel.
        void confirm({
            title: 'Clear the cart?',
            body: 'All rows in the current sale will be removed.',
            confirmLabel: 'Clear cart',
            tone: 'danger',
        }).then((ok) => {
            if (ok) onClearCart();
        });
    };

    useEffect(() => {
        const isEditable = (t: EventTarget | null): boolean => {
            if (!(t instanceof HTMLElement)) return false;
            if (t.isContentEditable) return true;
            const tag = t.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
        };
        const handler = (event: KeyboardEvent): void => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (isEditable(event.target)) return;
            const match = ACTIONS.find((a) => a.shortcut === event.key);
            if (!match) return;
            event.preventDefault();
            fire(match.key);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    });

    return (
        <div
            role="toolbar"
            aria-label="Cashier shortcuts"
            className="grid grid-cols-3 sm:grid-cols-5 gap-2"
        >
            {ACTIONS.map(({ key, label, shortcut, Icon }) => {
                const disabled = isDisabled(key);
                const primary = key === 'charge';
                const cls = disabled ? DISABLED : primary ? ENABLED_PRIMARY : ENABLED_NEUTRAL;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => fire(key)}
                        disabled={disabled}
                        aria-keyshortcuts={shortcut}
                        className={cls}
                    >
                        <Icon size={18} aria-hidden />
                        <span className="text-[12px] font-semibold tracking-tight">
                            {label}
                        </span>
                        <span
                            className={
                                primary && !disabled
                                    ? 'text-[10px] font-medium text-text-inv/80 tabular-nums'
                                    : 'text-[10px] font-medium text-text-3 tabular-nums'
                            }
                        >
                            {shortcut}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
