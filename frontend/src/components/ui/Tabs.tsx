import { type IconType as LucideIcon } from 'react-icons';
import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useRef } from 'react';
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
 * a full-width rail, the active tab carrying a 3px primary underline (every
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
    /**
     * When set, wires each tab's `id`/`aria-controls` to the matching
     * `role="tabpanel"` (rendered by `WorkspacePage` with the same base id) so the
     * full ARIA tabs pattern resolves. Omit for standalone toggles (e.g. POS).
     */
    idBase?: string;
}

/**
 * The app's tab-bar for tabbed workspaces (Accounting, HR, Sales, Transfers,
 * Branches, Financial reports). Two looks via {@link TabsVariant}: the default
 * `pill` (Ledger UI Kit direction A) and `underline` (the page sub-nav). Pairs
 * with `useTabParam` for URL-synced state. Implements the WAI-ARIA tabs pattern:
 * a roving tabindex plus Arrow/Home/End keys move and activate tabs. Never
 * hand-roll a tab bar.
 */
export function Tabs<T extends string>({
    tabs,
    active,
    onChange,
    ariaLabel,
    className,
    variant = 'pill',
    idBase,
}: TabsProps<T>) {
    const underline = variant === 'underline';
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        const idx = tabs.findIndex((t) => t.key === active);
        if (idx < 0) return;
        let nextIdx: number;
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIdx = (idx + 1) % tabs.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIdx = (idx - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                nextIdx = 0;
                break;
            case 'End':
                nextIdx = tabs.length - 1;
                break;
            default:
                return;
        }
        e.preventDefault();
        const nextKey = tabs[nextIdx].key;
        onChange(nextKey);
        tabRefs.current[nextKey]?.focus();
    };

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
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
        >
            {tabs.map((t) => {
                const isActive = active === t.key;
                const { Icon } = t;
                return (
                    <button
                        key={t.key}
                        ref={(el) => {
                            tabRefs.current[t.key] = el;
                        }}
                        type="button"
                        role="tab"
                        id={idBase ? `${idBase}-tab-${t.key}` : undefined}
                        aria-selected={isActive}
                        aria-controls={idBase ? `${idBase}-panel-${t.key}` : undefined}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange(t.key)}
                        className={cn(
                            'inline-flex items-center gap-2 text-[13px] whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                            underline
                                ? cn(
                                      'px-3 py-2.5 -mb-px border-b-[3px] rounded-t-sm font-medium transition-colors duration-150',
                                      isActive
                                          ? 'border-[color:var(--nav-tab-underline)] text-text-1 font-semibold'
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
