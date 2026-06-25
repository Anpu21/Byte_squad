import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const PAYMENT_METHODS = ['Cash', 'Card'] as const;

export type TPaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Body for `PATCH /hr/payroll/:id/mark-paid`. Stamps the payment date,
 * method (Cash or Card), and an optional disbursement reference (e.g. a
 * card terminal / transfer ref) on the payroll row.
 */
export class MarkPayrollPaidDto {
  @IsDateString()
  paymentDate!: string;

  @IsEnum(PAYMENT_METHODS)
  paymentMethod!: TPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentReference?: string;
}
