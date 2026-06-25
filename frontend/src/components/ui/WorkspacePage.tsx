import type { ReactNode } from 'react';
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
    const tabBar = (
        <Tabs
            tabs={tabs}
            active={active}
            onChange={onTabChange}
            ariaLabel={tabsAriaLabel}
        />
    );

    if (embedded) {
        return (
            <div className={className}>
                <div className="mb-6">{tabBar}</div>
                {children}
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
            {/* Frosted full-width band. The -mx values cancel <main>'s p-2/lg:p-4
                so the band + border bleed edge-to-edge; px restores pill align. */}
            <div className="sticky top-0 z-10 -mx-2 mb-6 border-b border-border bg-canvas/85 px-2 py-2.5 backdrop-blur-sm lg:-mx-4 lg:px-4">
                {tabBar}
            </div>
            <div
                key={active}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
                {children}
            </div>
        </div>
    );
}
