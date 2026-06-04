import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Receive a goods batch for a product (Phase C1). For admins, `branchId` picks
 * the target branch; for managers it is ignored and forced to the actor's
 * branch in the service.
 */
export class CreateProductBatchDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  batchNo?: string;

  @IsDateString()
  expiryDate!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
