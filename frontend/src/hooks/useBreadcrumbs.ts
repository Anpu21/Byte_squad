import { useLocation } from 'react-router-dom';
import { getRouteMeta } from '@/routes/routeMeta';

export function useBreadcrumbs(): string[] {
    const { pathname } = useLocation();
    const meta = getRouteMeta(pathname);
    return meta?.crumbs ?? [];
}
