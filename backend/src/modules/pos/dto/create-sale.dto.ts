import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Shanel-aligned line item shape used by `POST /pos/sales`. Each item carries
 * either the base unit (when `unitId` is omitted) or the chosen sellable unit;
 * the server resolves the conversion factor and persists a `baseUnitQty` in
 * the same currency the inventory table is measured in.
 *
 * `discountPercentage` is treated as a percentage of `quantity * unitPrice`.
 * `taxRate` is also a percentage; both surface back to the cashier on the
 * line totals row.
 */
export class CreateSaleItemDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  free?: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;
}

/**
 * Multi-tender payment payload — Shanel allows a single sale to be split
 * across cash, cheque, bank transfer, and customer credit. Cash overpayment
 * is returned as change; non-cash overpayment requires `keepBalance=true`
 * (the calculator service enforces this; the DTO only carries the inputs).
 */
export class CreateSalePaymentDto {
  @IsIn(['Cash', 'Card', 'Mobile', 'Cheque', 'Bank', 'Credit'])
  paymentMethod!: 'Cash' | 'Card' | 'Mobile' | 'Cheque' | 'Bank' | 'Credit';

  @IsNumber()
  @Min(0)
  paymentAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashTendered?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chequeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bankTransferAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditAmount?: number;

  @IsOptional()
  @IsBoolean()
  keepBalance?: boolean;

  // Cheque metadata — optional even when paymentMethod='Cheque' because the
  // POS may collect these details on a follow-up screen and patch later.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  chequeNo?: string;

  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  chequeBank?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  chequeBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  chequeDeliveredBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  chequeRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bankRef?: string;
}

/**
 * Top-level checkout payload for `POST /pos/sales`. `customerUserId` is
 * required when the payment carries credit (the calculator does not enforce
 * this; the service does, because the customer row is what holds the
 * running balance).
 */
export class CreateSaleDto {
  @IsOptional()
  @IsUUID()
  customerUserId?: string;

  /**
   * Walk-in loyalty customer attached to the sale (mutually exclusive
   * with `customerUserId`). The service rejects the request with a
   * BadRequestException when both ownership fields are set.
   */
  @IsOptional()
  @IsUUID()
  loyaltyCustomerId?: string;

  /**
   * Points the cashier wants to redeem against this sale. Capped server-
   * side by the redeem-cap-percent setting + available balance; the
   * wallet service throws BadRequestException if the cap is breached.
   * Ignored when no loyalty owner is attached.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  loyaltyRedeemPoints?: number;

  // saleType + priceLevel are persisted on the Sale row for historical
  // reporting, but the cashier UI no longer surfaces a wholesale toggle —
  // every new sale rings at retail. Both fields stay optional so the FE
  // can omit them; the service defaults to 'Retail' when absent.
  @IsOptional()
  @IsIn(['Retail', 'Wholesale'])
  saleType?: 'Retail' | 'Wholesale';

  @IsOptional()
  @IsIn(['Retail', 'Wholesale'])
  priceLevel?: 'Retail' | 'Wholesale';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cartDiscountPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cartDiscountAmount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ValidateNested()
  @Type(() => CreateSalePaymentDto)
  payment!: CreateSalePaymentDto;
}
