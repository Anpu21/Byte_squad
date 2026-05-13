import { forwardRef } from 'react';
import type { IPayhereCheckoutPayload } from '@/types';

interface PayhereRedirectFormProps {
    payment: IPayhereCheckoutPayload;
}

export const PayhereRedirectForm = forwardRef<
    HTMLFormElement,
    PayhereRedirectFormProps
>(function PayhereRedirectForm({ payment }, ref) {
    return (
        <form
            ref={ref}
            method="post"
            action={payment.actionUrl}
            aria-hidden="true"
            className="hidden"
        >
            {Object.entries(payment.fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
        </form>
    );
});
