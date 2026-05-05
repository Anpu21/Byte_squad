import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransferStatus } from '@common/enums/transfer-status.enum';

export class ListTransfersQueryDto {
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @IsUUID()
  @IsOptional()
  destinationBranchId?: string;

  @IsUUID()
  @IsOptional()
  sourceBranchId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
