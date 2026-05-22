import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransferRequestDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  requestedQuantity!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  requestReason?: string;

  // Optional. Required when an admin (who has no branch of their own) creates
  // a transfer; ignored when a manager creates one (their own branch is used).
  @IsUUID()
  @IsOptional()
  destinationBranchId?: string;
}
