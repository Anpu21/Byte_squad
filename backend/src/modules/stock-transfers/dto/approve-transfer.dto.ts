import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class ApproveTransferDto {
  @IsUUID()
  sourceBranchId!: string;

  @IsInt()
  @Min(1)
  approvedQuantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalNote?: string;
}
