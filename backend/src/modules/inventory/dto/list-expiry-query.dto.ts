import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query for the expiry report (Phase C1). `withinDays` caps how far out to
 * look (default 30 — the warning horizon). Admins may pass `branchId` to
 * narrow; managers are scoped to their own branch in the service.
 */
export class ListExpiryQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  withinDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
