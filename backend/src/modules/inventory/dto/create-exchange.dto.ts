import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSalesReturnLineDto } from '@inventory/dto/create-sales-return.dto';
import {
  CreateSaleItemDto,
  CreateSalePaymentDto,
} from '@pos/dto/create-sale.dto';

/**
 * Payload for `POST /returns/exchange` — take back items from an original sale
 * (`returnedLines`, reusing the return-line DTO incl. optional restock expiry)
 * and issue a replacement basket (`replacementItems`, the same shape as a POS
 * sale line) in one transaction.
 *
 * `payment` is required only when the replacement costs MORE than the returned
 * goods (a dearer swap → the customer pays the difference by Cash or Card).
 * Even and cheaper swaps omit it (a cheaper swap refunds the difference in cash
 * on the return leg).
 */
export class CreateExchangeDto {
  @IsUUID()
  saleId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalesReturnLineDto)
  returnedLines!: CreateSalesReturnLineDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  replacementItems!: CreateSaleItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSalePaymentDto)
  payment?: CreateSalePaymentDto;
}
