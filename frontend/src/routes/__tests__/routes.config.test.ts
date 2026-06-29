import { describe, it, expect } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { routes } from '../routes.config';

/** Flatten every `path` in the nested route tree, deepest paths included. */
function collectPaths(rs: RouteObject[]): string[] {
    return rs.flatMap((r) => [
        ...(r.path ? [r.path] : []),
        ...(r.children ? collectPaths(r.children) : []),
    ]);
}

/**
 * Smoke test: `createRoutesFromElements` runs at import time and throws if any
 * child isn't a `<Route>`/fragment, so simply importing a non-empty tree proves
 * the whole nested route config is structurally valid.
 */
describe('routes.config', () => {
    it('builds a valid, non-empty route tree', () => {
        expect(Array.isArray(routes)).toBe(true);
        expect(routes.length).toBeGreaterThan(0);
    });

    it('has a root route with children and a catch-all', () => {
        const root = routes[0];
        expect(root.children?.length).toBeGreaterThan(0);
        const paths = (root.children ?? []).map((r) => r.path);
        expect(paths).toContain('*');
    });

    it('mounts the cashier store-credit route', () => {
        expect(collectPaths(routes).join(',')).toContain('store-credit');
    });
});
