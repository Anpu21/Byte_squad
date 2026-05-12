/**
 * One-time migration: copy state from the legacy hand-rolled localStorage keys
 * into the unified redux-persist namespace. Run before persistStore() so the
 * persisted state is ready when redux-persist boots.
 *
 * Legacy keys:
 *   - ledgerpro_token       → auth.token
 *   - ledgerpro_user        → auth.user
 *   - ledgerpro_shop_cart   → shopCart.items
 *   - ledgerpro_admin_context → adminContext.selectedBranchId
 *
 * Target: persist:ledgerpro_root holding { auth, shopCart, adminContext } slices.
 */

const ROOT_KEY = 'persist:ledgerpro_root';
const LEGACY_KEYS = [
    'ledgerpro_token',
    'ledgerpro_user',
    'ledgerpro_shop_cart',
    'ledgerpro_admin_context',
] as const;

interface LegacyShopCart {
    items?: unknown[];
}

interface LegacyAdminContext {
    selectedBranchId?: string | null;
}

function tryParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function migrateLegacyPersistedState(): void {
    try {
        // If new persisted state already exists, assume migration ran before.
        if (localStorage.getItem(ROOT_KEY)) return;

        const legacyToken = localStorage.getItem('ledgerpro_token');
        const legacyUserRaw = localStorage.getItem('ledgerpro_user');
        const legacyShopCartRaw = localStorage.getItem('ledgerpro_shop_cart');
        const legacyAdminRaw = localStorage.getItem('ledgerpro_admin_context');

        const hasAnyLegacy =
            legacyToken ||
            legacyUserRaw ||
            legacyShopCartRaw ||
            legacyAdminRaw;
        if (!hasAnyLegacy) return;

        const legacyUser = tryParse<Record<string, unknown>>(legacyUserRaw);
        const legacyShopCart =
            tryParse<LegacyShopCart>(legacyShopCartRaw) ?? {};
        const legacyAdmin =
            tryParse<LegacyAdminContext>(legacyAdminRaw) ?? {};

        // redux-persist stores each slice as a stringified JSON value keyed
        // by slice name, with an _persist meta entry alongside.
        const rootState: Record<string, string> = {
            auth: JSON.stringify({
                user: legacyUser,
                token: legacyToken,
                isAuthenticated: !!legacyToken && !!legacyUser,
                isLoading: false,
                error: null,
            }),
            shopCart: JSON.stringify({
                items: Array.isArray(legacyShopCart.items)
                    ? legacyShopCart.items
                    : [],
                isCartOpen: false,
            }),
            adminContext: JSON.stringify({
                selectedBranchId:
                    typeof legacyAdmin.selectedBranchId === 'string'
                        ? legacyAdmin.selectedBranchId
                        : null,
            }),
            _persist: JSON.stringify({ version: 1, rehydrated: true }),
        };

        localStorage.setItem(ROOT_KEY, JSON.stringify(rootState));

        for (const key of LEGACY_KEYS) {
            localStorage.removeItem(key);
        }
    } catch {
        // Best-effort. If migration fails, redux-persist falls back to a
        // fresh state and the user will simply need to log in again.
    }
}
