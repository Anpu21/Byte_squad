import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CustomerOrderPaymentMode } from '@common/enums/customer-order-payment-mode.enum';

/**
 * Check out a group's shared cart. The paying member is the authenticated user;
 * `paymentMode` chooses PayHere (ONLINE) vs pay-at-pickup (MANUAL). Loyalty
 * redemption is intentionally not offered for group checkout in v1.
 */
export class CheckoutGroupCartDto {
  @IsOptional()
  @IsEnum(CustomerOrderPaymentMode)
  paymentMode?: CustomerOrderPaymentMode;

  @IsOptional()
  @IsString()
  note?: string;
}
