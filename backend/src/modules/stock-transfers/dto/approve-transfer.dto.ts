import { IsInt, IsUUID, Min } from 'class-validator';

export class ApproveTransferDto {
  @IsUUID()
  sourceBranchId!: string;

  @IsInt()
  @Min(1)
  approvedQuantity!: number;
}
