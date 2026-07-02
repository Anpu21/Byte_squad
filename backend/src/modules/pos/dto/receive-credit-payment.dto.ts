import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

// The shop accepts Cash + Card only (card via PayHere); bank transfer was
// removed as a khata-repayment option.
export const CREDIT_PAYMENT_METHODS = ['Cash', 'Card'] as const;

export type CreditPaymentMethod = (typeof CREDIT_PAYMENT_METHODS)[number];

export class ReceiveCreditPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(CREDIT_PAYMENT_METHODS)
  method!: CreditPaymentMethod;

  /** Required for admins; managers are pinned to their own branch. */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
