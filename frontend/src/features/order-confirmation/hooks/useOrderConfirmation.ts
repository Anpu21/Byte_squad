import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { customerOrdersService } from '@/services/customer-orders.service';
import { queryKeys } from '@/lib/queryKeys';

export function useOrderConfirmation() {
    const { code } = useParams<{ code: string }>();
    const [generated, setGenerated] = useState<{
        code: string;
        url: string;
    } | null>(null);

    const {
        data: order,
        isLoading,
        error,
    } = useQuery({
        queryKey: queryKeys.customerOrders.byCode(code ?? ''),
        queryFn: () => customerOrdersService.findByCode(code!),
        enabled: !!code,
    });

    const storedQr = order?.qrCodeUrl ?? null;

    useEffect(() => {
        if (storedQr || !code) return;
        let cancelled = false;
        QRCode.toDataURL(code, {
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        })
            .then((url) => {
                if (!cancelled) setGenerated({ code, url });
            })
            .catch((err) => {
                console.error('QR render failed', err);
                if (!cancelled) setGenerated(null);
            });
        return () => {
            cancelled = true;
        };
    }, [code, storedQr]);

    const qrDataUrl =
        storedQr ??
        (generated && generated.code === code ? generated.url : null);

    return { order, isLoading, error, qrDataUrl };
}
