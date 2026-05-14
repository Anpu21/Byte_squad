import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class AdminDirectTransferLineDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestReason?: string;
}

export class CreateAdminDirectTransferDto {
  @IsUUID()
  sourceBranchId!: string;

  @IsUUID()
  destinationBranchId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalNote?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminDirectTransferLineDto)
  lines!: AdminDirectTransferLineDto[];
}

export type { AdminDirectTransferLineDto };
