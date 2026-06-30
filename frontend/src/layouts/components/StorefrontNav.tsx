import { Link, useLocation } from 'react-router-dom';
import {
    LuStore as Store,
    LuUsers as Users,
    LuScrollText as ScrollText,
    LuSparkles as Sparkles,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

interface StorefrontNavProps {
    /** `pills` — inline segmented group for the header (desktop).
     *  `bottom` — fixed bottom bar for small screens. */
    variant?: 'pills' | 'bottom';
    className?: string;
}

interface NavTab {
    label: string;
    to: string;
    Icon: IconType;
    isActive: (pathname: string) => boolean;
}

const isGroups = (p: string) => p.startsWith(FRONTEND_ROUTES.SHOP_GROUPS);
const isOrders = (p: string) => p.startsWith(FRONTEND_ROUTES.SHOP_MY_ORDERS);
const isRewards = (p: string) => p.startsWith(FRONTEND_ROUTES.SHOP_REWARDS);
const isProfile = (p: string) => p.startsWith(FRONTEND_ROUTES.SHOP_PROFILE);

const TABS: NavTab[] = [
    {
        label: 'Shop',
        to: FRONTEND_ROUTES.SHOP,
        Icon: Store,
        // Active anywhere under /shop that isn't Groups, Orders, Rewards or
        // Profile (covers the catalog, product detail, cart and checkout).
        isActive: (p) =>
            p.startsWith(FRONTEND_ROUTES.SHOP) &&
            !isGroups(p) &&
            !isOrders(p) &&
            !isRewards(p) &&
            !isProfile(p),
    },
    {
        label: 'Groups',
        to: FRONTEND_ROUTES.SHOP_GROUPS,
        Icon: Users,
        isActive: isGroups,
    },
    {
        label: 'Orders',
        to: FRONTEND_ROUTES.SHOP_MY_ORDERS,
        Icon: ScrollText,
        isActive: isOrders,
    },
    {
        label: 'Rewards',
        to: FRONTEND_ROUTES.SHOP_REWARDS,
        Icon: Sparkles,
        isActive: isRewards,
    },
];

export function StorefrontNav({
    variant = 'pills',
    className,
}: StorefrontNavProps) {
    const { pathname } = useLocation();

    if (variant === 'bottom') {
        return (
            <nav
                aria-label="Storefront"
                className={cn(
                    'fixed bottom-0 inset-x-0 z-sticky flex border-t border-border bg-surface/95 backdrop-blur-md',
                    className,
                )}
            >
                {TABS.map(({ label, to, Icon, isActive }) => {
                    const active = isActive(pathname);
                    return (
                        <Link
                            key={label}
                            to={to}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                                active
                                    ? 'text-primary'
                                    : 'text-text-3 hover:text-text-1',
                            )}
                        >
                            <Icon size={18} aria-hidden="true" />
                            {label}
                        </Link>
                    );
                })}
            </nav>
        );
    }

    return (
        <nav
            aria-label="Storefront"
            className={cn(
                'items-center gap-1 rounded-lg border border-border bg-surface-2 p-1',
                className,
            )}
        >
            {TABS.map(({ label, to, Icon, isActive }) => {
                const active = isActive(pathname);
                return (
                    <Link
                        key={label}
                        to={to}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                            active
                                ? 'bg-primary text-text-inv shadow-xs'
                                : 'text-text-2 hover:bg-surface-hover hover:text-text-1',
                        )}
                    >
                        <Icon size={15} aria-hidden="true" />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
