import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';

/**
 * Storefront search-box state: mirrors `?q=` while on the shop (debounced,
 * replace-history) and navigates to the shop on submit from anywhere else.
 */
export function useStorefrontSearch() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isOnShop = location.pathname === FRONTEND_ROUTES.SHOP;
    const urlQ = isOnShop ? (searchParams.get('q') ?? '') : '';
    const [searchDraft, setSearchDraft] = useState(urlQ);

    useEffect(() => {
        setSearchDraft(urlQ);
    }, [urlQ]);

    useEffect(() => {
        if (!isOnShop) return;
        if (searchDraft === urlQ) return;
        const timer = setTimeout(() => {
            setSearchParams(
                (prev) => {
                    if (searchDraft) prev.set('q', searchDraft);
                    else prev.delete('q');
                    return prev;
                },
                { replace: true },
            );
        }, 200);
        return () => clearTimeout(timer);
    }, [searchDraft, urlQ, isOnShop, setSearchParams]);

    const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const q = searchDraft.trim();
        if (isOnShop) return;
        const target = q
            ? `${FRONTEND_ROUTES.SHOP}?q=${encodeURIComponent(q)}`
            : FRONTEND_ROUTES.SHOP;
        navigate(target);
    };

    const handleSearchClear = () => {
        setSearchDraft('');
        if (isOnShop) {
            setSearchParams(
                (prev) => {
                    prev.delete('q');
                    return prev;
                },
                { replace: true },
            );
        }
    };

    return { searchDraft, setSearchDraft, handleSearchSubmit, handleSearchClear };
}
