import { useEffect } from 'react';
import { LuBanknote as Banknote, LuCreditCard as CreditCard } from 'react-icons/lu';
import { type IconType as LucideIcon } from 'react-icons';
import type { TPaymentMethod } from '@/types';

interface IPosPaymentMethodProps {
    value: TPaymentMethod;
    onChange: (next: TPaymentMethod) => void;
}

interface IMethodOption {
    key: TPaymentMethod;
    label: string;
    /** Number-row shortcut. Skipped when modifier keys are held. */
    shortcut: '1' | '2';
    Icon: LucideIcon;
}

// The shop accepts Cash + Card only (card settles via PayHere). The Credit
// (khata) tender is driven separately by the credit-account panel.
const METHODS: readonly IMethodOption[] = [
    { key: 'Cash', label: 'Cash', shortcut: '1', Icon: Banknote },
    { key: 'Card', label: 'Card', shortcut: '2', Icon: CreditCard },
];

/**
 * Pill row to switch the active payment tender. The active pill uses
 * the primary token; inactive pills use the muted surface tone so the
 * cashier can scan the row at a glance.
 *
 * Number-row shortcuts fire `onChange` when the matching key is pressed at
 * the document level. Modifier-key combinations (Ctrl/Meta/Alt) are ignored
 * so we don't hijack browser shortcuts, and we bail when the focused element
 * is an input/textarea/contenteditable to avoid swallowing a numeric entry
 * in the tender forms.
 */
export function PosPaymentMethod({
    value,
    onChange,
}: IPosPaymentMethodProps) {
    useEffect(() => {
        const isEditableTarget = (target: EventTarget | null): boolean => {
            if (!(target instanceof HTMLElement)) return false;
            if (target.isContentEditable) return true;
            const tag = target.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
        };

        const handler = (event: KeyboardEvent): void => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (isEditableTarget(event.target)) return;
            const match = METHODS.find((m) => m.shortcut === event.key);
            if (!match) return;
            event.preventDefault();
            if (match.key !== value) onChange(match.key);
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [value, onChange]);

    return (
        <div
            role="radiogroup"
            aria-label="Payment method"
            className="grid grid-cols-2 gap-2"
        >
            {METHODS.map(({ key, label, shortcut, Icon }) => {
                const isActive = key === value;
                return (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => onChange(key)}
                        className={
                            isActive
                                ? 'flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-md border border-primary bg-primary text-text-inv shadow-sm-token transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-[3px] focus:ring-primary/30'
                                : 'flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-md border border-border-strong bg-surface-2 text-text-2 hover:border-primary hover:text-text-1 hover:bg-surface transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-[3px] focus:ring-primary/30'
                        }
                    >
                        <Icon size={18} aria-hidden />
                        <span className="text-[12px] font-semibold tracking-tight">
                            {label}
                        </span>
                        <span
                            className={
                                isActive
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
