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
}
