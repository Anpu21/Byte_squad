import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const CREDIT_ACCOUNT_PAYMENT_METHODS = ['Cash', 'Card', 'Bank'] as const;

export type CreditAccountPaymentMethod =
  (typeof CREDIT_ACCOUNT_PAYMENT_METHODS)[number];

/**
 * Record a repayment against a credit account. The owning branch is taken
 * from the account itself (accounts are branch-owned), so no branchId here.
 */
export class ReceiveCreditAccountPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(CREDIT_ACCOUNT_PAYMENT_METHODS)
  method!: CreditAccountPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
