import { type ReactNode, useId } from 'react';
import PageHeader from './PageHeader';
import { Tabs, type TabItem } from './Tabs';

interface WorkspacePageProps<T extends string> {
    /**
     * Page title (also surfaced by the app-shell breadcrumb). Omit only when the
     * nested content already renders its own rich header (e.g. the Branch hub,
     * whose sub-pages own their headers + export controls) — the sticky tab band
     * still renders, just without a duplicate title above it.
     */
    title?: ReactNode;
    eyebrow?: ReactNode;
    subtitle?: ReactNode;
    /** Page-level actions, rendered on the right of the header. */
    actions?: ReactNode;

    tabs: TabItem<T>[];
    active: T;
    onTabChange: (key: T) => void;
    tabsAriaLabel: string;

    children: ReactNode;
    /**
     * When this workspace is nested inside another (Accounting's "reports" tab
     * renders FinancialReports; Inventory's "transfers" tab renders the transfer
     * board), render only the bare pill + content — no header, no sticky band —
     * so two sticky bars never stack and the title isn't duplicated.
     */
    embedded?: boolean;
    className?: string;
}

/**
 * The standard chrome for every tabbed workspace (Accounting, Sales, Inventory,
 * HR, Purchases, Transfers, Branches, Financial reports). Renders a uniform
 * {@link PageHeader} and a **frosted sticky sub-nav band** that pins under the
 * app-header (`layouts/DashboardLayout` `<main>` is the scroll container) so the
 * tab switcher stays in reach while long tables scroll beneath it.
 *
 * The sticky band lives *outside* the entry-animation wrapper on purpose: an
 * `animate-in` transform creates a containing block that would otherwise break
 * `position: sticky` against `<main>`. Chrome is stable; only the tab content
 * animates (and re-animates on tab change via `key`).
 */
export function WorkspacePage<T extends string>({
    title,
    eyebrow,
    subtitle,
    actions,
    tabs,
    active,
    onTabChange,
    tabsAriaLabel,
    children,
    embedded = false,
    className,
}: WorkspacePageProps<T>) {
    const baseId = useId();
    const tabBar = (
        <Tabs
            tabs={tabs}
            active={active}
            onChange={onTabChange}
            ariaLabel={tabsAriaLabel}
            variant={embedded ? 'pill' : 'underline'}
            idBase={baseId}
        />
    );
    const panel = (
        <div
            key={active}
            role="tabpanel"
            id={`${baseId}-panel-${active}`}
            aria-labelledby={`${baseId}-tab-${active}`}
            tabIndex={0}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none"
        >
            {children}
        </div>
    );

    if (embedded) {
        return (
            <div className={className}>
                <div className="mb-6">{tabBar}</div>
                {panel}
            </div>
        );
    }

    return (
        <div className={className}>
            {title != null && (
                <PageHeader
                    eyebrow={eyebrow}
                    title={title}
                    subtitle={subtitle}
                    actions={actions}
                />
            )}
            {/* Solid sticky band — shares <main>'s padding box (no negative-margin
                math). The underline Tabs own the single bottom rail; the band is
                solid (not frosted) so it matches the solid header above it. */}
            <div className="sticky top-0 z-10 mb-6 bg-canvas pt-2.5">
                {tabBar}
            </div>
            {panel}
        </div>
    );
}
