import type { IPayhereCheckoutPayload } from '@/types';

export interface GatewayState {
    payment: IPayhereCheckoutPayload;
    orderCode: string;
    branchName: string;
    finalTotal: number;
    itemCount: number;
}
