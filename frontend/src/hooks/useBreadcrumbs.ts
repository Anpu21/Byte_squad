import { useMatches } from 'react-router-dom';

interface CrumbHandle {
    crumbs?: string[];
}

/**
 * Breadcrumb segments for the current route, read from the matched route's
 * `handle.crumbs` (deepest match that defines them wins). Routes co-locate their
 * crumbs in `config/*.routes.tsx`; a route with no `handle` yields `[]`, and the
 * header renders no breadcrumb nav — matching the prior behaviour.
 */
export function useBreadcrumbs(): string[] {
    const matches = useMatches();
    for (let i = matches.length - 1; i >= 0; i--) {
        const handle = matches[i].handle as CrumbHandle | undefined;
        if (handle?.crumbs) return handle.crumbs;
    }
    return [];
}
