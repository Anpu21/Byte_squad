import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { usePayhereGateway } from '@/features/payhere-gateway/hooks/usePayhereGateway';
import { PayhereGatewayCard } from '@/features/payhere-gateway/components/PayhereGatewayCard';

export function PayhereGatewayPage() {
    const p = usePayhereGateway();

    if (!p.state) {
        return <Navigate to={FRONTEND_ROUTES.SHOP_MY_ORDERS} replace />;
    }

    return (
        <PayhereGatewayCard
            state={p.state}
            formRef={p.formRef}
            secondsLeft={p.secondsLeft}
            onCancel={p.cancel}
        />
    );
}
