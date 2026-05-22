import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { GatewayState } from '../types';

function isGatewayState(value: unknown): value is GatewayState {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    if (typeof v.orderCode !== 'string') return false;
    if (typeof v.branchName !== 'string') return false;
    if (typeof v.finalTotal !== 'number') return false;
    if (typeof v.itemCount !== 'number') return false;
    if (!v.payment || typeof v.payment !== 'object') return false;
    const p = v.payment as Record<string, unknown>;
    if (typeof p.actionUrl !== 'string') return false;
    if (!p.fields || typeof p.fields !== 'object') return false;
    return true;
}

const COUNTDOWN_START_SECONDS = 2;
const TICK_MS = 750;

export interface UsePayhereGatewayReturn {
    state: GatewayState | null;
    formRef: React.RefObject<HTMLFormElement | null>;
    secondsLeft: number;
    cancel: () => void;
}

export function usePayhereGateway(): UsePayhereGatewayReturn {
    const navigate = useNavigate();
    const location = useLocation();
    const formRef = useRef<HTMLFormElement | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_START_SECONDS);
    const [cancelled, setCancelled] = useState(false);

    const state = isGatewayState(location.state) ? location.state : null;

    useEffect(() => {
        if (!state || cancelled) return;

        if (secondsLeft <= 0) {
            formRef.current?.submit();
            return;
        }

        const id = setTimeout(() => {
            setSecondsLeft((s) => s - 1);
        }, TICK_MS);
        return () => clearTimeout(id);
    }, [state, cancelled, secondsLeft]);

    const cancel = useCallback(() => {
        setCancelled(true);
        if (!state) return;
        navigate(
            FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
                ':code',
                state.orderCode,
            ),
            { replace: true },
        );
    }, [navigate, state]);

    return { state, formRef, secondsLeft, cancel };
}
