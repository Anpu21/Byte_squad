import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PayhereCheckoutCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface PayhereCheckoutOrder {
  orderId: string;
  orderCode: string;
  amount: number;
  currency: string;
  itemsLabel: string;
}

export interface PayhereCheckoutPayload {
  provider: 'payhere';
  actionUrl: string;
  fields: Record<string, string>;
}

export interface PayhereNotifyPayload {
  merchant_id?: string;
  order_id?: string;
  payhere_amount?: string;
  payhere_currency?: string;
  status_code?: string;
  md5sig?: string;
  payment_id?: string;
  method?: string;
  status_message?: string;
}

@Injectable()
export class PayhereService {
  private readonly currency = 'LKR';

  constructor(private readonly config: ConfigService) {}

  createCheckoutPayload(
    order: PayhereCheckoutOrder,
    customer: PayhereCheckoutCustomer,
  ): PayhereCheckoutPayload {
    const merchantId = this.required('PAYHERE_MERCHANT_ID');
    const frontendUrl = this.config.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );
    const notifyUrl =
      this.config.get<string>('PAYHERE_NOTIFY_URL') ??
      `${this.config.get<string>('BACKEND_PUBLIC_URL', 'http://localhost:3000')}/api/v1/customer-orders/payhere/notify`;
    const returnUrl =
      this.config.get<string>('PAYHERE_RETURN_URL') ??
      `${frontendUrl}/shop/orders/${order.orderCode}?payment=return`;
    const cancelUrl =
      this.config.get<string>('PAYHERE_CANCEL_URL') ??
      `${frontendUrl}/shop/orders/${order.orderCode}?payment=cancel`;
    const amount = this.formatAmount(order.amount);

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: order.orderId,
      items: order.itemsLabel,
      currency: order.currency,
      amount,
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? '',
      address: 'LedgerPro pickup order',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash: this.createCheckoutHash(order.orderId, amount, order.currency),
    };

    return {
      provider: 'payhere',
      actionUrl: this.config.get<string>(
        'PAYHERE_CHECKOUT_URL',
        'https://sandbox.payhere.lk/pay/checkout',
      ),
      fields,
    };
  }

  createCheckoutHash(
    providerOrderId: string,
    amount: string,
    currency = this.currency,
  ): string {
    const merchantId = this.required('PAYHERE_MERCHANT_ID');
    const hashedSecret = this.secretHash();
    return this.md5(
      `${merchantId}${providerOrderId}${amount}${currency}${hashedSecret}`,
    );
  }

  verifyNotifySignature(payload: PayhereNotifyPayload): boolean {
    if (
      !payload.merchant_id ||
      !payload.order_id ||
      !payload.payhere_amount ||
      !payload.payhere_currency ||
      !payload.status_code ||
      !payload.md5sig
    ) {
      return false;
    }
    const expected = this.md5(
      `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${this.secretHash()}`,
    );
    return expected === payload.md5sig.toUpperCase();
  }

  isMerchantValid(payload: PayhereNotifyPayload): boolean {
    return payload.merchant_id === this.required('PAYHERE_MERCHANT_ID');
  }

  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  private secretHash(): string {
    return this.md5(this.required('PAYHERE_MERCHANT_SECRET'));
  }

  private md5(value: string): string {
    return crypto.createHash('md5').update(value).digest('hex').toUpperCase();
  }

  private required(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException(`${key} is not configured`);
    }
    return value;
  }
}
