import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentStatus } from '@common/enums/shipment-status.enum';

export class ListShipmentsQueryDto {
  @IsEnum(ShipmentStatus)
  @IsOptional()
  status?: ShipmentStatus;

  /** Admin-only: filter to shipments touching this branch (source OR dest). */
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
