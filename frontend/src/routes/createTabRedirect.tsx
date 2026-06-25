import { Navigate } from 'react-router-dom';

/**
 * Builds a redirect component that maps a legacy standalone path onto a unified
 * tabbed hub with the matching tab selected (e.g. `/transactions` →
 * `/sales?tab=transactions`). The hub's default tab is kept out of the URL so
 * canonical links stay clean — the hub falls back to it when the param is
 * absent. `param` supports namespaced cases (e.g. `transferTab`).
 *
 * Replaces the four hand-written redirect components (Sales / Accounting /
 * Inventory / Admin HR) that all shared this exact shape.
 */
export function createTabRedirect<T extends string>(
    route: string,
    defaultTab: T,
    param = 'tab',
) {
    return function TabRedirect({ tab }: { tab: T }) {
        const search = tab === defaultTab ? '' : `?${param}=${tab}`;
        return <Navigate to={`${route}${search}`} replace />;
    };
}
