import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const PAYMENT_METHODS = ['Cash', 'Bank_Transfer', 'Cheque'] as const;

export type TPaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Body for `PATCH /hr/payroll/:id/mark-paid`. Stamps the payment date,
 * method, and (for Bank_Transfer) the bank reference number on the
 * payroll row.
 */
export class MarkPayrollPaidDto {
  @IsDateString()
  paymentDate!: string;

  @IsEnum(PAYMENT_METHODS)
  paymentMethod!: TPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankReferenceNo?: string;
}
