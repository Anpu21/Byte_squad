import { type IconType as LucideIcon } from 'react-icons';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
    key: T;
    label: string;
    Icon?: LucideIcon;
    /** Optional trailing count/badge (e.g. the transfers pipeline count). */
    badge?: ReactNode;
}

interface TabsProps<T extends string> {
    tabs: TabItem<T>[];
    active: T;
    onChange: (key: T) => void;
    ariaLabel: string;
    className?: string;
}

/**
 * The app's pill tab-bar for tabbed workspaces (Accounting, HR, Sales,
 * Transfers, Branches, Financial reports). Ledger UI Kit direction A: a
 * contained surface-2 bar with a solid-primary active pill. Pairs with
 * `useTabParam` for URL-synced state. Icons and badges are optional so a single
 * primitive covers every hub — never hand-roll a tab bar.
 */
export function Tabs<T extends string>({
    tabs,
    active,
    onChange,
    ariaLabel,
    className,
}: TabsProps<T>) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 p-[5px] bg-surface-2 rounded-[12px] border border-border w-fit max-w-full overflow-x-auto',
                className,
            )}
            role="tablist"
            aria-label={ariaLabel}
        >
            {tabs.map((t) => {
                const isActive = active === t.key;
                const { Icon } = t;
                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(t.key)}
                        className={cn(
                            'inline-flex items-center gap-2 px-4 py-[9px] rounded-md text-[13px] font-semibold whitespace-nowrap transition-all duration-150 outline-none active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-focus/25',
                            isActive
                                ? 'bg-primary text-text-inv shadow-sm-token'
                                : 'text-text-2 hover:text-text-1 hover:bg-surface',
                        )}
                    >
                        {Icon && <Icon size={15} strokeWidth={2.1} aria-hidden />}
                        {t.label}
                        {t.badge != null && (
                            <span
                                className={cn(
                                    'mono text-[11px] font-semibold min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full px-1.5 leading-none',
                                    isActive
                                        ? 'bg-text-inv/15 text-text-inv'
                                        : 'bg-surface text-text-3',
                                )}
                            >
                                {t.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
