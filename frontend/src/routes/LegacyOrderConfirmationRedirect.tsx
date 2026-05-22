import { Navigate, useParams } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function LegacyOrderConfirmationRedirect() {
    const { code } = useParams<{ code: string }>();
    const target = FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
        ':code',
        code ?? '',
    );

    return <Navigate to={target} replace />;
}
