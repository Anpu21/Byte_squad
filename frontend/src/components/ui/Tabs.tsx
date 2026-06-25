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

/**
 * `pill` — the contained surface-2 bar with a solid-primary active pill (POS
 * mode switch, embedded sub-workspaces). `underline` — GitHub-style flat tabs on
 * a full-width rail, the active tab carrying a 2px primary underline (every
 * top-level workspace sub-nav).
 */
export type TabsVariant = 'pill' | 'underline';

interface TabsProps<T extends string> {
    tabs: TabItem<T>[];
    active: T;
    onChange: (key: T) => void;
    ariaLabel: string;
    className?: string;
    /** Visual treatment. Defaults to `pill` so existing callers are untouched. */
    variant?: TabsVariant;
}

/**
 * The app's tab-bar for tabbed workspaces (Accounting, HR, Sales, Transfers,
 * Branches, Financial reports). Two looks via {@link TabsVariant}: the default
 * `pill` (Ledger UI Kit direction A — contained surface-2 bar, solid-primary
 * active pill) and `underline` (GitHub-style, used by the page sub-nav). Pairs
 * with `useTabParam` for URL-synced state. Icons and badges are optional so a
 * single primitive covers every hub — never hand-roll a tab bar.
 */
export function Tabs<T extends string>({
    tabs,
    active,
    onChange,
    ariaLabel,
    className,
    variant = 'pill',
}: TabsProps<T>) {
    const underline = variant === 'underline';
    return (
        <div
            className={cn(
                underline
                    ? 'flex items-stretch gap-1 border-b border-border w-full overflow-x-auto'
                    : 'inline-flex items-center gap-1 p-[5px] bg-surface-2 rounded-[12px] border border-border w-fit max-w-full overflow-x-auto',
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
                            'inline-flex items-center gap-2 text-[13px] whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                            underline
                                ? cn(
                                      'px-3 py-2.5 -mb-px border-b-2 rounded-t-sm font-medium transition-colors duration-150',
                                      isActive
                                          ? 'border-primary text-text-1 font-semibold'
                                          : 'border-transparent text-text-2 hover:text-text-1 hover:border-border-strong',
                                  )
                                : cn(
                                      'px-4 py-[9px] rounded-md font-semibold transition-all duration-150 active:scale-[0.97]',
                                      isActive
                                          ? 'bg-primary text-text-inv shadow-sm-token'
                                          : 'text-text-2 hover:text-text-1 hover:bg-surface',
                                  ),
                        )}
                    >
                        {Icon && <Icon size={15} strokeWidth={2.1} aria-hidden />}
                        {t.label}
                        {t.badge != null && (
                            <span
                                className={cn(
                                    'mono text-[11px] font-semibold min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full px-1.5 leading-none',
                                    underline
                                        ? isActive
                                            ? 'bg-primary-soft text-primary-soft-text'
                                            : 'bg-surface-2 text-text-3'
                                        : isActive
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
