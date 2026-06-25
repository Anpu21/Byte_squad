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
 * Transfers). Pairs with `useTabParam` for URL-synced state. Icons and badges
 * are optional so a single primitive covers every hub.
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
                'flex items-center gap-1 mb-6 p-[5px] bg-surface-2 rounded-[12px] border border-border w-fit overflow-x-auto',
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
                            'flex items-center gap-2 px-4 py-[9px] rounded-md text-[13px] font-semibold transition-all whitespace-nowrap focus:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                            isActive
                                ? 'bg-primary text-text-inv shadow-sm-token'
                                : 'text-text-2 hover:text-text-1 hover:bg-surface',
                        )}
                    >
                        {Icon && <Icon size={14} strokeWidth={2} aria-hidden />}
                        {t.label}
                        {t.badge != null && (
                            <span
                                className={cn(
                                    'text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1.5',
                                    isActive
                                        ? 'bg-primary-soft text-primary-soft-text'
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
