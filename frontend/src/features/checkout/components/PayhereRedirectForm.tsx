import { useEffect, useRef } from 'react';
import type { IPayhereCheckoutPayload } from '@/types';

interface PayhereRedirectFormProps {
    payment: IPayhereCheckoutPayload;
}

export function PayhereRedirectForm({ payment }: PayhereRedirectFormProps) {
    const formRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        formRef.current?.submit();
    }, []);

    return (
        <form ref={formRef} method="post" action={payment.actionUrl}>
            {Object.entries(payment.fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
        </form>
    );
}
